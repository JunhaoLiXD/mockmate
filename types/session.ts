/**
 * Voice session contract between Jerry's voice client (lib/voice/) and Yuki's live room UI.
 * The UI renders from this hook only and never calls getUserMedia or WebRTC directly.
 */

import type { TranscriptTurn } from "./transcript";

/** Connection and audio state exposed to the UI (brief section 17.1). */
export type VoiceSessionState =
  | "idle"
  | "requesting-mic"
  | "mic-denied"
  | "connecting"
  | "ai-speaking"
  | "listening"
  | "ended"
  | "error";

export type VoiceSessionErrorCode =
  | "MIC_UNAVAILABLE"
  | "SESSION_CREATE_FAILED"
  | "CONNECTION_FAILED"
  | "DISCONNECTED"
  | "VOICE_DISABLED"
  | "RATE_LIMITED"
  | "UNKNOWN";

export interface VoiceSessionError {
  code: VoiceSessionErrorCode;
  /** User-facing English message. */
  message: string;
  retryable: boolean;
}

/** Why the session ended, for the end-of-interview screen. */
export type SessionEndReason = "user-ended" | "time-limit" | "error";

export interface UseInterviewSessionResult {
  state: VoiceSessionState;
  turns: TranscriptTurn[];
  elapsedSeconds: number;
  /** Hard client-side limit for this session. */
  maxDurationSeconds: number;
  /** Plan question currently being discussed, when known. */
  currentQuestionId: string | null;
  error: VoiceSessionError | null;
  endReason: SessionEndReason | null;
  /** True while the candidate's microphone is muted. The interviewer can still speak. */
  micMuted: boolean;
  setMicMuted: (muted: boolean) => void;
  /** Requests the microphone, creates the session and connects. */
  start: () => Promise<void>;
  /** Ends the session and releases the microphone and connection. */
  end: () => void;
}

/**
 * Interview-level phases from the state machine in brief section 4.4.
 * Used by the interview controller; the UI mainly needs VoiceSessionState.
 */
export type InterviewPhase =
  | "PREPARING"
  | "READY"
  | "CONNECTING"
  | "INTRODUCTION"
  | "QUESTION"
  | "FOLLOWUP"
  | "NEXT_QUESTION"
  | "WRAP_UP"
  | "EVALUATING"
  | "REPORT_READY"
  | "ERROR"
  | "DISCONNECTED"
  | "CANCELLED";
