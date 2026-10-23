"use client";

/**
 * Drop-in stand-in for the real voice hook (handoff H5). Same return type, scripted behavior,
 * no microphone or network. Use `scenario` to preview every live-room state.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  InterviewPlan,
  SessionEndReason,
  TranscriptTurn,
  UseInterviewSessionResult,
  VoiceSessionError,
  VoiceSessionState,
} from "@/types";
import { mockTranscript } from "./transcript";

export type MockSessionScenario = "normal" | "mic-denied" | "connection-error" | "short-time-limit";

export interface MockSessionOptions {
  scenario?: MockSessionScenario;
  /** Delay between scripted turns. */
  turnIntervalMs?: number;
}

export function useMockInterviewSession(
  plan: InterviewPlan,
  { scenario = "normal", turnIntervalMs = 2500 }: MockSessionOptions = {},
): UseInterviewSessionResult {
  const maxDurationSeconds = scenario === "short-time-limit" ? 15 : plan.durationMinutes * 60;

  const [state, setState] = useState<VoiceSessionState>("idle");
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<VoiceSessionError | null>(null);
  const [endReason, setEndReason] = useState<SessionEndReason | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
  }, []);

  const finish = useCallback(
    (reason: SessionEndReason) => {
      clearTimers();
      setState("ended");
      setEndReason(reason);
    },
    [clearTimers],
  );

  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const start = useCallback(async () => {
    clearTimers();
    setTurns([]);
    setElapsedSeconds(0);
    setError(null);
    setEndReason(null);
    setState("requesting-mic");

    if (scenario === "mic-denied") {
      later(700, () => {
        setState("mic-denied");
        setError({ code: "MIC_UNAVAILABLE", message: "Microphone access was blocked. Allow it in your browser settings and try again.", retryable: true });
      });
      return;
    }

    later(700, () => setState("connecting"));

    if (scenario === "connection-error") {
      later(1800, () => {
        setState("error");
        setError({ code: "CONNECTION_FAILED", message: "We couldn't connect to the interviewer. Check your network and try again.", retryable: true });
      });
      return;
    }

    later(1600, () => {
      let seconds = 0;
      ticker.current = setInterval(() => {
        seconds += 1;
        setElapsedSeconds(seconds);
        if (seconds >= maxDurationSeconds) finish("time-limit");
      }, 1000);

      mockTranscript.forEach((turn, i) => {
        later(i * turnIntervalMs, () => {
          setTurns((prev) => [...prev, turn]);
          setState(turn.speaker === "interviewer" ? "ai-speaking" : "listening");
        });
      });
    });
  }, [clearTimers, finish, maxDurationSeconds, scenario, turnIntervalMs]);

  const end = useCallback(() => finish("user-ended"), [finish]);

  useEffect(() => clearTimers, [clearTimers]);

  const currentQuestionId = turns.length > 0 ? (turns[turns.length - 1].questionId ?? null) : null;

  return { state, turns, elapsedSeconds, maxDurationSeconds, currentQuestionId, error, endReason, start, end };
}
