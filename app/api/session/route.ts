import type { SessionResponse } from "@/types";
import { RATE_LIMITS } from "@/types";
import { buildInterviewerInstructions, maxDurationSecondsFor, parseSessionPlan } from "@/lib/interview/instructions";
import { getServerEnv } from "@/lib/server/env";
import { apiError, getClientIp, hashIdentifier, isSameOrigin, readJsonBody } from "@/lib/server/http";
import { checkRateLimit, releaseRateLimit } from "@/lib/server/rateLimit";

/**
 * POST /api/session — creates a Realtime voice session via the unified interface.
 * Docs: https://developers.openai.com/api/docs/guides/realtime-webrtc (unified interface)
 */

export const maxDuration = 30;

const OPENAI_CALLS_URL = "https://api.openai.com/v1/realtime/calls";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_SDP_CHARS = 20_000;
const WINDOW_MS = RATE_LIMITS.windowMinutes * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request): Promise<Response> {
  const env = getServerEnv();
  if (!env.aiEnabled) return apiError(503, "AI_DISABLED", "The demo is temporarily paused. Please try again later.");
  if (!env.voiceEnabled) return apiError(503, "VOICE_DISABLED", "Voice interviews are temporarily paused. Please try again later.");

  if (!env.openaiApiKey || !env.realtimeModel || !env.transcribeModel) {
    const missing = [
      !env.openaiApiKey && "OPENAI_API_KEY",
      !env.realtimeModel && "REALTIME_MODEL",
      !env.transcribeModel && "TRANSCRIBE_MODEL",
    ].filter(Boolean);
    console.error("[api/session] missing server configuration:", missing.join(", "));
    return apiError(500, "INTERNAL_ERROR", "Voice is not configured on the server.");
  }

  if (!isSameOrigin(request)) return apiError(403, "INVALID_INPUT", "Requests must come from the MockMate site.");

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) {
    return body.tooLarge
      ? apiError(413, "INPUT_TOO_LARGE", "The session request is too large.")
      : apiError(400, "INVALID_INPUT", "The session request is not valid JSON.");
  }

  const value = body.value as { sdp?: unknown; plan?: unknown } | null;
  const sdp = typeof value?.sdp === "string" ? value.sdp : "";
  if (!sdp.startsWith("v=0") || sdp.length > MAX_SDP_CHARS) {
    return apiError(400, "INVALID_INPUT", "Missing or invalid WebRTC offer.", { field: "sdp" });
  }
  const plan = parseSessionPlan(value?.plan);
  if (!plan) return apiError(400, "INVALID_INPUT", "Missing or invalid interview plan.", { field: "plan" });

  const ip = getClientIp(request);
  const ipKey = `voice:${ip}`;
  // Voice limits are counted in interview minutes, so longer interviews use more of the budget.
  const minutes = plan.durationMinutes;
  const perIp = checkRateLimit(ipKey, RATE_LIMITS.voiceMinutesPerWindow, WINDOW_MS, minutes);
  if (!perIp.allowed) {
    return apiError(429, "RATE_LIMITED", "You've used your practice time for now. Please wait a few minutes and try again.", {
      retryAfterSeconds: perIp.retryAfterSeconds,
    });
  }
  const daily = checkRateLimit("voice:global", RATE_LIMITS.globalVoiceMinutesPerDay, DAY_MS, minutes);
  if (!daily.allowed) {
    releaseRateLimit(ipKey, perIp.slotId);
    return apiError(429, "RATE_LIMITED", "The demo has reached today's interview limit. Please try again tomorrow.", {
      retryAfterSeconds: daily.retryAfterSeconds,
    });
  }

  const session = {
    type: "realtime",
    model: env.realtimeModel,
    instructions: buildInterviewerInstructions(plan),
    audio: {
      input: {
        transcription: { model: env.transcribeModel },
        // "low" lets candidates pause to think mid-answer without the interviewer jumping in.
        // https://developers.openai.com/api/docs/guides/realtime-vad#semantic-vad
        turn_detection: { type: "semantic_vad", eagerness: "low" },
      },
      output: { voice: env.realtimeVoice },
    },
  };

  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify(session));

  let upstream: Response;
  try {
    upstream = await fetch(OPENAI_CALLS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        "OpenAI-Safety-Identifier": hashIdentifier(ip),
      },
      body: form,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    // No voice session was created, so nothing was billed.
    releaseRateLimit(ipKey, perIp.slotId);
    releaseRateLimit("voice:global", daily.slotId);
    console.error("[api/session] upstream request failed:", error instanceof Error ? error.name : "unknown");
    return apiError(502, "UPSTREAM_ERROR", "Couldn't reach the voice service. Please try again.");
  }

  if (!upstream.ok) {
    releaseRateLimit(ipKey, perIp.slotId);
    releaseRateLimit("voice:global", daily.slotId);
    // Log status and OpenAI's error message only; never the request body or headers.
    const detail = await upstream.text().catch(() => "");
    console.error("[api/session] OpenAI returned", upstream.status, detail.slice(0, 500));
    return apiError(502, "UPSTREAM_ERROR", "The voice service couldn't start the interview. Please try again.");
  }

  const answerSdp = await upstream.text();
  const response: SessionResponse = { answerSdp, maxDurationSeconds: maxDurationSecondsFor(plan) };
  return Response.json(response, { status: 201 });
}
