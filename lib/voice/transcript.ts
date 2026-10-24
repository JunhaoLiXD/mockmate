import type { Speaker, TranscriptTurn } from "@/types";

/**
 * Builds ordered transcript turns from Realtime server events (brief section 4.3).
 * Pure functions so the rules can be reasoned about and tested without a connection.
 *
 * Events used (https://developers.openai.com/api/reference/resources/realtime/server-events):
 * - input_audio_buffer.speech_started                        user turn begins (fixes ordering)
 * - conversation.item.input_audio_transcription.delta/completed  user text
 * - response.output_audio_transcript.delta/done              interviewer text
 * - response.done (status "cancelled")                       interviewer was interrupted
 */

export interface TranscriptState {
  turns: TranscriptTurn[];
  /** Realtime item_id -> turn id. */
  itemToTurn: Record<string, string>;
  /** Interviewer item currently being spoken, if any. */
  activeInterviewerItemId: string | null;
}

export const EMPTY_TRANSCRIPT: TranscriptState = { turns: [], itemToTurn: {}, activeInterviewerItemId: null };

export interface RealtimeServerEvent {
  type: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
  response?: { status?: string };
}

function turnId(index: number): string {
  return `t-${String(index + 1).padStart(3, "0")}`;
}

function ensureTurn(state: TranscriptState, itemId: string, speaker: Speaker, nowIso: string): TranscriptState {
  if (state.itemToTurn[itemId]) return state;
  const id = turnId(state.turns.length);
  const turn: TranscriptTurn = { id, speaker, text: "", timestamp: nowIso, isFinal: false };
  return { ...state, turns: [...state.turns, turn], itemToTurn: { ...state.itemToTurn, [itemId]: id } };
}

function updateTurn(state: TranscriptState, itemId: string, update: (turn: TranscriptTurn) => TranscriptTurn): TranscriptState {
  const id = state.itemToTurn[itemId];
  if (!id) return state;
  return { ...state, turns: state.turns.map((t) => (t.id === id ? update(t) : t)) };
}

/** Marks the in-progress interviewer turn as interrupted, keeping the text already spoken. */
function interruptInterviewer(state: TranscriptState): TranscriptState {
  const itemId = state.activeInterviewerItemId;
  if (!itemId) return state;
  const next = updateTurn(state, itemId, (t) => (t.isFinal ? t : { ...t, isFinal: true, interrupted: true }));
  return { ...next, activeInterviewerItemId: null };
}

export function applyRealtimeEvent(state: TranscriptState, event: RealtimeServerEvent, nowIso: string): TranscriptState {
  const itemId = event.item_id;

  switch (event.type) {
    case "input_audio_buffer.speech_started": {
      const interrupted = interruptInterviewer(state);
      return itemId ? ensureTurn(interrupted, itemId, "user", nowIso) : interrupted;
    }

    case "conversation.item.input_audio_transcription.delta": {
      if (!itemId || !event.delta) return state;
      const withTurn = ensureTurn(state, itemId, "user", nowIso);
      return updateTurn(withTurn, itemId, (t) => (t.isFinal ? t : { ...t, text: t.text + event.delta }));
    }

    case "conversation.item.input_audio_transcription.completed": {
      if (!itemId) return state;
      const withTurn = ensureTurn(state, itemId, "user", nowIso);
      return updateTurn(withTurn, itemId, (t) => ({ ...t, text: (event.transcript ?? t.text).trim(), isFinal: true }));
    }

    case "response.output_audio_transcript.delta": {
      if (!itemId || !event.delta) return state;
      const withTurn = ensureTurn(state, itemId, "interviewer", nowIso);
      const next = updateTurn(withTurn, itemId, (t) => (t.isFinal ? t : { ...t, text: t.text + event.delta }));
      return { ...next, activeInterviewerItemId: itemId };
    }

    case "response.output_audio_transcript.done": {
      if (!itemId) return state;
      const withTurn = ensureTurn(state, itemId, "interviewer", nowIso);
      // An interrupted turn keeps only what was actually spoken.
      const next = updateTurn(withTurn, itemId, (t) =>
        t.interrupted ? t : { ...t, text: (event.transcript ?? t.text).trim(), isFinal: true },
      );
      return state.activeInterviewerItemId === itemId ? { ...next, activeInterviewerItemId: null } : next;
    }

    case "response.done":
      return event.response?.status === "cancelled" ? interruptInterviewer(state) : state;

    default:
      return state;
  }
}
