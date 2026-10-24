import type { ReportResponse } from "@/types";
import { INPUT_LIMITS, RATE_LIMITS } from "@/types";
import { AiError, generateStructured } from "@/lib/ai/structured";
import { buildInterviewReport, collectReportSources } from "@/lib/report/buildReport";
import { buildReportInput, buildReportInstructions } from "@/lib/report/prompt";
import { isCompleteAnswer, REPORT_LIMITS, reportRequestSchema, turnsInOrder } from "@/lib/report/requestSchema";
import { getDimensionRubrics } from "@/lib/report/rubric";
import { reportOutputSchema } from "@/lib/report/schema";
import { getServerEnv } from "@/lib/server/env";
import { apiError, getClientIp, hashIdentifier, isSameOrigin, readJsonBody } from "@/lib/server/http";
import { checkRateLimit, releaseRateLimit } from "@/lib/server/rateLimit";

/**
 * POST /api/report — ReportRequest (JSON) → ReportResponse.
 * EVALUATOR_MODEL grades the transcript with Lisa's rubric; the server verifies every quote,
 * derives levels' scores and rubric text, and drops anything it cannot verify.
 * Stateless: nothing is stored, and request bodies and transcripts are never logged.
 *
 * Known limitation: plan and profile evidence come from the browser and cannot be re-checked
 * against GitHub here. A tampered request only changes that user's own report.
 */

export const maxDuration = 60;

const MAX_BODY_BYTES = 256 * 1024;
const WINDOW_MS = RATE_LIMITS.windowMinutes * 60 * 1000;
const AI_TIMEOUT_MS = 45_000;

export async function POST(request: Request): Promise<Response> {
  const env = getServerEnv();
  if (!env.aiEnabled) return apiError(503, "AI_DISABLED", "The demo is temporarily paused. Please try again later.");
  if (!env.openaiApiKey || !env.evaluatorModel) {
    const missing = [!env.openaiApiKey && "OPENAI_API_KEY", !env.evaluatorModel && "EVALUATOR_MODEL"].filter(Boolean);
    console.error("[api/report] missing server configuration:", missing.join(", "));
    return apiError(500, "INTERNAL_ERROR", "Feedback reports are not configured on the server.");
  }
  if (!isSameOrigin(request)) return apiError(403, "INVALID_INPUT", "Requests must come from the MockMate site.");

  /* ---------- Validate (no paid calls yet) ---------- */

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) {
    return body.tooLarge
      ? apiError(413, "INPUT_TOO_LARGE", "The interview is too long to evaluate.")
      : apiError(400, "INVALID_INPUT", "The report request is not valid JSON.");
  }

  const rawTranscript = (body.value as { transcript?: unknown } | null)?.transcript;
  if (Array.isArray(rawTranscript)) {
    const totalChars = rawTranscript.reduce<number>(
      (n, t) => n + (typeof (t as { text?: unknown })?.text === "string" ? (t as { text: string }).text.length : 0),
      0,
    );
    if (rawTranscript.length > INPUT_LIMITS.reportMaxTurns || totalChars > REPORT_LIMITS.maxTranscriptChars) {
      return apiError(413, "INPUT_TOO_LARGE", "The interview is too long to evaluate.", { field: "transcript" });
    }
  }

  const parsed = reportRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return apiError(400, "INVALID_INPUT", "The report request is missing data or has invalid values.", {
      ...(typeof field === "string" ? { field } : {}),
    });
  }
  const reportRequest = parsed.data;
  if (!turnsInOrder(reportRequest.transcript)) {
    return apiError(400, "INVALID_INPUT", "The transcript turns are out of order.", { field: "transcript" });
  }
  if (!reportRequest.transcript.some(isCompleteAnswer)) {
    return apiError(422, "INVALID_INPUT", "Answer at least one question to get a report.", { field: "transcript" });
  }

  /* ---------- Rate limit, then the paid call ---------- */

  const ip = getClientIp(request);
  const ipKey = `report:${ip}`;
  const limit = checkRateLimit(ipKey, RATE_LIMITS.reportsPerWindow, WINDOW_MS);
  if (!limit.allowed) {
    return apiError(429, "RATE_LIMITED", "You've requested several reports recently. Please wait a few minutes and try again.", {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const sources = collectReportSources(reportRequest);
  const questionIds = reportRequest.plan.questions.map((q) => q.id);

  try {
    const output = await generateStructured({
      apiKey: env.openaiApiKey,
      model: env.evaluatorModel,
      name: "interview_report",
      schema: reportOutputSchema(reportRequest.plan.mode, questionIds),
      instructions: buildReportInstructions(reportRequest),
      input: buildReportInput(reportRequest, sources),
      maxOutputTokens: 8_000,
      reasoningEffort: "low",
      safetyIdentifier: hashIdentifier(ip),
      timeoutMs: AI_TIMEOUT_MS,
    });

    const report = buildInterviewReport({
      request: reportRequest,
      output,
      sources,
      rubrics: getDimensionRubrics(reportRequest.plan.mode),
    });
    const response: ReportResponse = { report };
    return Response.json(response);
  } catch (error) {
    // Refund only when OpenAI rejected the request; timeouts and cut-off outputs were billed.
    if (error instanceof AiError && error.kind === "upstream") releaseRateLimit(ipKey, limit.slotId);
    if (error instanceof AiError) {
      if (error.kind === "timeout") return apiError(504, "UPSTREAM_ERROR", "Writing the report took too long. Please try again.");
      if (error.kind === "refusal") return apiError(422, "INVALID_INPUT", "This interview couldn't be evaluated.");
      return apiError(502, "UPSTREAM_ERROR", "The report service had a problem. Please try again.");
    }
    console.error("[api/report] unexpected error:", error instanceof Error ? error.name : "unknown");
    return apiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
  }
}
