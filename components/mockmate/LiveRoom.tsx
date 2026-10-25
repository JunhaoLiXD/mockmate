"use client";

/**
 * Live interview room. Layout ported from Yuki's meeting-room prototype (PR #1); the scripted
 * questions, camera and recording are replaced by the real voice session hook.
 */

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { InterviewPlan, SessionEndReason, TranscriptTurn, UseInterviewSessionResult, VoiceSessionState } from "@/types";
import { COMPANY_STYLES, INTERVIEW_MODES } from "@/types";
import { useInterviewSession } from "@/lib/voice/useInterviewSession";
import { useMockInterviewSession } from "@/mocks/useMockInterviewSession";

export interface RoomResult {
  turns: TranscriptTurn[];
  endReason: SessionEndReason | null;
}

interface RoomProps {
  plan: InterviewPlan;
  onFinished: (result: RoomResult) => void;
}

export function LiveRoom(props: RoomProps & { useMock: boolean }) {
  return props.useMock ? <MockRoom {...props} /> : <RealRoom {...props} />;
}

function RealRoom({ plan, onFinished }: RoomProps) {
  return <LiveRoomView plan={plan} session={useInterviewSession(plan)} onFinished={onFinished} />;
}

function MockRoom({ plan, onFinished }: RoomProps) {
  return <LiveRoomView plan={plan} session={useMockInterviewSession(plan)} onFinished={onFinished} isMock />;
}

const STATUS: Record<VoiceSessionState, { text: string; pill: string }> = {
  idle: { text: "Ready when you are", pill: "NOT STARTED" },
  "requesting-mic": { text: "Waiting for microphone permission…", pill: "MIC CHECK" },
  "mic-denied": { text: "Microphone blocked", pill: "MIC BLOCKED" },
  connecting: { text: "Connecting to your interviewer…", pill: "CONNECTING" },
  "ai-speaking": { text: "Interviewer is speaking", pill: "LIVE" },
  listening: { text: "Listening — answer out loud", pill: "LIVE" },
  ended: { text: "Interview ended", pill: "ENDED" },
  error: { text: "Connection problem", pill: "ERROR" },
};

function clock(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function LiveRoomView({
  plan,
  session,
  onFinished,
  isMock = false,
}: {
  plan: InterviewPlan;
  session: UseInterviewSessionResult;
  onFinished: (result: RoomResult) => void;
  isMock?: boolean;
}) {
  const { state, turns, elapsedSeconds, maxDurationSeconds, error, endReason, micMuted } = session;
  const live = state === "ai-speaking" || state === "listening";
  const busy = live || state === "connecting" || state === "requesting-mic";
  const canStart = state === "idle";
  const lastInterviewer = [...turns].reverse().find((t) => t.speaker === "interviewer" && t.text);
  const modeLabel = INTERVIEW_MODES.find((m) => m.value === plan.mode)?.label ?? plan.mode;
  const styleLabel = COMPANY_STYLES.find((s) => s.value === plan.companyStyle)?.label ?? plan.companyStyle;
  const progress = maxDurationSeconds > 0 ? Math.min(100, (elapsedSeconds / maxDurationSeconds) * 100) : 0;
  const statusText = isMock && state === "requesting-mic" ? "Starting sample…"
    : isMock && state === "listening" ? "Playing a scripted answer" : STATUS[state].text;
  const statusPill = isMock && state === "requesting-mic" ? "STARTING" : STATUS[state].pill;

  const transcriptEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns]);

  const caption =
    lastInterviewer?.text ??
    (state === "connecting" ? "Connecting…" : canStart ? "Your interviewer is ready when you are." : "…");

  // Keep the newest words of a long caption in view while the interviewer is speaking.
  const captionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = captionRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [caption]);

  return (
    <section className="stage" aria-labelledby="practice-title">
      <div className="stage-heading">
        <div>
          <span className="section-kicker">03 / INTERVIEW ROOM</span>
          <h2 id="practice-title">Your interview.</h2>
          <p>{isMock ? "Watch a scripted interview and end it after all turns appear to see the sample report." : "Answer out loud. You can interrupt, ask for a repeat, or end at any time."}</p>
        </div>
        <span className="heading-decoration" aria-hidden="true">
          ◌
        </span>
      </div>

      <div className="notice">
        <span>✳</span>
        <p>
          {isMock ? (
            <>
              <strong>Mock session.</strong> Scripted turns, no microphone or AI.
            </>
          ) : (
            <>
              <strong>Live voice.</strong> Your microphone audio goes to OpenAI to run the interview. It is not
              recorded or stored. Use headphones for the best experience.
            </>
          )}
        </p>
      </div>

      <div className="room-layout">
        <div className="room-main">
          <div className="room-top">
            <div className="room-avatar">
              m<span>.</span>
            </div>
            <div>
              <strong>MockMate interviewer{isMock && " (mock)"}</strong>
              <small aria-live="polite">{statusText}</small>
            </div>
            <span className={`room-live${live ? " is-live" : ""}${isMock ? " is-mock" : ""}`}>
              {live && <span></span>}
              {isMock ? `MOCK · ${statusPill}` : STATUS[state].pill}
            </span>
          </div>

          <div className="interview-stage" aria-label="Interview room">
            <div className="stage-meta">
              <span>
                {modeLabel} · {styleLabel}
              </span>
              <span>
                {clock(elapsedSeconds)} / {clock(maxDurationSeconds)}
              </span>
            </div>
            <div className="coach-avatar">
              <Image
                src="/coach-gator.png"
                alt="Friendly original alligator coach in a navy cardigan"
                width={1374}
                height={1145}
                priority
              />
            </div>
            <div className="stage-dialogue">
              <div className={`waveform${state === "ai-speaking" ? " is-active" : ""}`} aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => (
                  <i key={i}></i>
                ))}
              </div>
              <div className="stage-caption" aria-live="polite" ref={captionRef}>
                {caption}
              </div>
            </div>

            {canStart && (
              <div className="stage-start">
                <strong>{isMock ? "Mock interview (scripted, no microphone)" : "Ready for your interview?"}</strong>
                <p>
                  {plan.questions.length} planned questions · up to {Math.round(maxDurationSeconds / 60)} minutes.
                  {isMock ? " No microphone is needed for this sample." : " Your browser will ask for microphone access."}
                </p>
                <button type="button" className="button button-primary" onClick={() => void session.start()}>
                  Start interview <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>

          <div className="meeting-toolbar">
            <button
              type="button"
              className="meeting-control"
              aria-pressed={micMuted}
              disabled={!live}
              onClick={() => session.setMicMuted(!micMuted)}
            >
              {micMuted ? "◌ Mic off" : "🎙 Mic on"}
            </button>
            <button type="button" className="meeting-control meeting-end" disabled={!busy} onClick={session.end}>
              End interview
            </button>
          </div>

          {error && (
            <>
              <p className="meeting-error" role="alert">
                {error.message}
              </p>
              {error.retryable && (
                <button type="button" className="button button-primary retry-meeting" onClick={() => void session.start()}>
                  Try again
                </button>
              )}
            </>
          )}

          <div className="room-transcript">
            <div className="transcript-heading">
              <strong>Live transcript</strong>
              <small>Machine-generated; may contain errors.</small>
            </div>
            <div className="transcript" aria-live="off">
              {turns.length === 0 && <p className="field-hint">The conversation will appear here.</p>}
              {turns.map((turn) => (
                <div key={turn.id} className={`turn ${turn.speaker === "interviewer" ? "interviewer" : "candidate"}`}>
                  <div className="turn-label">
                    {turn.speaker === "interviewer" ? "Interviewer" : "You"} · {turn.id}
                    {(!turn.isFinal || turn.interrupted) && (
                      <span className="turn-flags">{turn.interrupted ? "interrupted" : "in progress"}</span>
                    )}
                  </div>
                  <div className="bubble">{turn.text || "…"}</div>
                </div>
              ))}
              <div ref={transcriptEnd} />
            </div>
          </div>
        </div>

        <aside className="room-side">
          <span className="mini-label">SESSION NOTES</span>
          <h3>Make the thinking visible.</h3>
          <p>
            {plan.mode === "technical"
              ? "Explain constraints, alternatives, and how you validated your choice."
              : "Use a specific event: what you did personally, and what changed as a result."}
          </p>
          <div className="progress-block">
            <div className="progress-label">
              <span>Time used</span>
              <strong>
                {clock(elapsedSeconds)} / {clock(maxDurationSeconds)}
              </strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }}></span>
            </div>
          </div>
          {(state === "ended" || (state === "error" && turns.length > 0)) && (
            <div className="room-controls">
              <p className="field-hint" style={{ margin: 0 }}>
                {endReason === "time-limit" ? "Time is up." : "Interview finished."} {turns.length} turns captured.
              </p>
              <button type="button" className="button button-primary" onClick={() => onFinished({ turns, endReason })}>
                Review my interview <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
          <div className="unavailable">
            <strong>Tips</strong>
            <span>Say &ldquo;Could you repeat that?&rdquo; anytime. Interrupting is fine.</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
