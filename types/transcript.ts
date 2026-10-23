/**
 * Transcript turns assembled by the voice client (brief section 4.3).
 *
 * Rules:
 * - Transcription deltas update the same turn; `isFinal` becomes true on the completed/done event.
 * - An interrupted interviewer turn keeps the text already spoken and sets `interrupted: true`.
 * - Turns still incomplete when the session ends stay with `isFinal: false`; reports must not
 *   treat them as complete answers.
 */

export type Speaker = "user" | "interviewer";

export interface TranscriptTurn {
  /** Stable, ordered id within a session: "t-001", "t-002", ... */
  id: string;
  speaker: Speaker;
  text: string;
  /** ISO 8601 time the turn started. */
  timestamp: string;
  /** Plan question this turn belongs to, when known. */
  questionId?: string;
  isFinal: boolean;
  interrupted?: boolean;
  /** 0–1 when the transcription model reports it. */
  transcriptionConfidence?: number;
}
