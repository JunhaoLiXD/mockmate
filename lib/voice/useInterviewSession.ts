"use client";

/**
 * Browser voice client for the live interview (handoff H5).
 * Owns microphone access, the WebRTC connection, the "oai-events" data channel,
 * transcript assembly, the session timer and cleanup. UI code renders from the return value only.
 *
 * Flow (https://developers.openai.com/api/docs/guides/realtime-webrtc, unified interface):
 * getUserMedia -> RTCPeerConnection + data channel -> SDP offer -> POST /api/session -> SDP answer.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ApiErrorBody,
  InterviewPlan,
  SessionEndReason,
  SessionRequest,
  SessionResponse,
  TranscriptTurn,
  UseInterviewSessionResult,
  VoiceSessionError,
  VoiceSessionState,
} from "@/types";
import { API_ROUTES, SESSION_LIMITS } from "@/types";
import { applyRealtimeEvent, EMPTY_TRANSCRIPT, type RealtimeServerEvent, type TranscriptState } from "./transcript";

export interface InterviewSessionOptions {
  /** Called with each server event type, for debugging. Never receives transcript text. */
  onEventType?: (type: string) => void;
}

interface Connection {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  mic: MediaStream;
  audio: HTMLAudioElement;
}

const KICKOFF_FALLBACK_MS = 3000;

function micError(error: unknown): VoiceSessionError {
  const name = error instanceof DOMException ? error.name : "";
  const message =
    name === "NotFoundError"
      ? "No microphone was found. Connect a microphone and try again."
      : "Microphone access was blocked. Allow microphone access in your browser settings and try again.";
  return { code: "MIC_UNAVAILABLE", message, retryable: true };
}

async function sessionError(response: Response): Promise<VoiceSessionError> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  const code = body?.error.code;
  const message = body?.error.message ?? "We couldn't start the interview. Please try again.";
  if (code === "VOICE_DISABLED" || code === "AI_DISABLED") return { code: "VOICE_DISABLED", message, retryable: false };
  if (code === "RATE_LIMITED") return { code: "RATE_LIMITED", message, retryable: true };
  return { code: "SESSION_CREATE_FAILED", message, retryable: true };
}

export function useInterviewSession(plan: InterviewPlan, options: InterviewSessionOptions = {}): UseInterviewSessionResult {
  const [state, setState] = useState<VoiceSessionState>("idle");
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState(
    Math.min(plan.durationMinutes, SESSION_LIMITS.defaultDurationMinutes) * 60,
  );
  const [error, setError] = useState<VoiceSessionError | null>(null);
  const [endReason, setEndReason] = useState<SessionEndReason | null>(null);
  const [micMuted, setMicMutedState] = useState(false);

  const connection = useRef<Connection | null>(null);
  const transcript = useRef<TranscriptState>(EMPTY_TRANSCRIPT);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; kickoff?: ReturnType<typeof setTimeout> }>({});
  const active = useRef(false);
  const kickedOff = useRef(false);
  const onEventType = useRef(options.onEventType);

  useEffect(() => {
    onEventType.current = options.onEventType;
  }, [options.onEventType]);

  /** Releases microphone, connection and timers. Safe to call more than once. */
  const teardown = useCallback(() => {
    active.current = false;
    clearInterval(timers.current.tick);
    clearTimeout(timers.current.kickoff);
    timers.current = {};
    const conn = connection.current;
    connection.current = null;
    if (!conn) return;
    conn.mic.getTracks().forEach((track) => track.stop());
    try {
      conn.dc.close();
    } catch {
      /* already closed */
    }
    conn.pc.close();
    conn.audio.pause();
    conn.audio.srcObject = null;
  }, []);

  const finish = useCallback(
    (reason: SessionEndReason, failure?: VoiceSessionError) => {
      if (!active.current && !connection.current) return;
      teardown();
      setEndReason(reason);
      if (failure) {
        setError(failure);
        setState("error");
      } else {
        setState("ended");
      }
    },
    [teardown],
  );

  const kickoff = useCallback(() => {
    const dc = connection.current?.dc;
    if (kickedOff.current || !dc || dc.readyState !== "open") return;
    kickedOff.current = true;
    clearTimeout(timers.current.kickoff);
    // Ask the interviewer to greet the candidate and ask the first planned question.
    dc.send(JSON.stringify({ type: "response.create" }));
  }, []);

  const handleServerEvent = useCallback(
    (event: RealtimeServerEvent & { error?: { message?: string; code?: string } }) => {
      onEventType.current?.(event.type);

      const next = applyRealtimeEvent(transcript.current, event, new Date().toISOString());
      if (next !== transcript.current) {
        transcript.current = next;
        setTurns(next.turns);
      }

      switch (event.type) {
        case "session.created":
          kickoff();
          break;
        case "output_audio_buffer.started":
        case "response.output_audio_transcript.delta":
          setState("ai-speaking");
          break;
        case "output_audio_buffer.stopped":
        case "output_audio_buffer.cleared":
        case "input_audio_buffer.speech_started":
          setState("listening");
          break;
        case "error":
          // Server errors are usually recoverable (e.g. a rejected client event); keep the call alive.
          console.warn("[voice] server error event:", event.error?.code ?? "unknown");
          break;
      }
    },
    [kickoff],
  );

  const start = useCallback(async () => {
    if (active.current) return;
    active.current = true;
    kickedOff.current = false;
    transcript.current = EMPTY_TRANSCRIPT;
    setTurns([]);
    setElapsedSeconds(0);
    setError(null);
    setEndReason(null);
    setMicMutedState(false);
    setState("requesting-mic");

    let mic: MediaStream;
    try {
      mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      active.current = false;
      setError(micError(err));
      setState("mic-denied");
      return;
    }
    if (!active.current) {
      mic.getTracks().forEach((track) => track.stop());
      return;
    }

    setState("connecting");
    const pc = new RTCPeerConnection();
    const audio = new Audio();
    audio.autoplay = true;
    pc.ontrack = (e) => {
      audio.srcObject = e.streams[0];
      audio.play().catch(() => {
        /* autoplay is allowed after the user's click; ignore rare rejections */
      });
    };
    mic.getAudioTracks().forEach((track) => pc.addTrack(track, mic));

    // The data channel must exist before creating the offer.
    const dc = pc.createDataChannel("oai-events");
    connection.current = { pc, dc, mic, audio };

    dc.addEventListener("message", (e: MessageEvent<string>) => {
      try {
        handleServerEvent(JSON.parse(e.data));
      } catch {
        /* ignore malformed event */
      }
    });
    dc.addEventListener("open", () => {
      // Fallback in case session.created arrived before listeners were ready.
      timers.current.kickoff = setTimeout(kickoff, KICKOFF_FALLBACK_MS);
    });
    pc.addEventListener("connectionstatechange", () => {
      if (!active.current) return;
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        finish("error", { code: "DISCONNECTED", message: "The connection was lost. You can start a new interview.", retryable: true });
      }
    });

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const request: SessionRequest = { plan, sdp: offer.sdp ?? "" };
      const response = await fetch(API_ROUTES.session, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        finish("error", await sessionError(response));
        return;
      }
      const session = (await response.json()) as SessionResponse;
      if (!active.current) return;
      await pc.setRemoteDescription({ type: "answer", sdp: session.answerSdp });

      setMaxDurationSeconds(session.maxDurationSeconds);
      setState("listening");
      let seconds = 0;
      timers.current.tick = setInterval(() => {
        seconds += 1;
        setElapsedSeconds(seconds);
        if (seconds >= session.maxDurationSeconds) finish("time-limit");
      }, 1000);
    } catch {
      finish("error", { code: "CONNECTION_FAILED", message: "We couldn't connect to the interviewer. Check your network and try again.", retryable: true });
    }
  }, [finish, handleServerEvent, kickoff, plan]);

  const end = useCallback(() => finish("user-ended"), [finish]);

  /** Mutes by disabling the outgoing track; the connection and interviewer audio stay live. */
  const setMicMuted = useCallback((muted: boolean) => {
    connection.current?.mic.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
    setMicMutedState(muted);
  }, []);

  // Release the microphone and connection if the component unmounts mid-interview.
  useEffect(() => teardown, [teardown]);

  return {
    state,
    turns,
    elapsedSeconds,
    maxDurationSeconds,
    currentQuestionId: null,
    error,
    endReason,
    micMuted,
    setMicMuted,
    start,
    end,
  };
}
