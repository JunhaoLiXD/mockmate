"use client";

/**
 * Temporary voice check page for milestone M1 (owned by Jerry, not part of the product UI).
 * Uses the mock plan so the real voice loop can be tested before the intake flow exists.
 */

import { useCallback, useState } from "react";
import { useInterviewSession } from "@/lib/voice/useInterviewSession";
import { mockPlan } from "@/mocks/plan";

const MAX_EVENT_LOG = 40;

export default function VoiceCheckPage() {
  const [events, setEvents] = useState<string[]>([]);
  const onEventType = useCallback((type: string) => {
    setEvents((prev) => [type, ...prev].slice(0, MAX_EVENT_LOG));
  }, []);

  const session = useInterviewSession(mockPlan, { onEventType });
  const running = !["idle", "ended", "error", "mic-denied"].includes(session.state);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 font-sans">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Voice check (M1)</h1>
        <p className="text-sm text-gray-500">
          Internal test page. Uses a sample technical plan. Audio is sent to OpenAI for processing and is not stored.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void session.start()}
          disabled={running}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-40"
        >
          Start interview
        </button>
        <button
          type="button"
          onClick={session.end}
          disabled={!running}
          className="rounded border px-4 py-2 disabled:opacity-40"
        >
          End
        </button>
        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-900">state: {session.state}</span>
        <span className="font-mono text-sm">
          {session.elapsedSeconds}s / {session.maxDurationSeconds}s
        </span>
        {session.endReason && <span className="text-sm text-gray-500">ended: {session.endReason}</span>}
      </section>

      {session.error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {session.error.code}: {session.error.message}
        </p>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Transcript</h2>
        <ol className="space-y-2">
          {session.turns.map((turn) => (
            <li key={turn.id} className="rounded border p-3 text-sm">
              <div className="mb-1 font-mono text-xs text-gray-500">
                {turn.id} · {turn.speaker === "interviewer" ? "Interviewer" : "You"}
                {!turn.isFinal && " · in progress"}
                {turn.interrupted && " · interrupted"}
              </div>
              <p>{turn.text || "…"}</p>
            </li>
          ))}
        </ol>
      </section>

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">Server event types ({events.length})</summary>
        <ul className="mt-2 font-mono text-xs text-gray-500">
          {events.map((type, i) => (
            <li key={`${i}-${type}`}>{type}</li>
          ))}
        </ul>
      </details>
    </main>
  );
}
