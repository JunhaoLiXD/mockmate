import type { PlanResponse } from "@/types";
import { INTERVIEW_DURATIONS, isInterviewDuration, RATE_LIMITS } from "@/types";
import { AiError, generateStructured } from "@/lib/ai/structured";
import { buildInterviewPlan } from "@/lib/plan/buildPlan";
import { buildPlanInput, buildPlanInstructions, collectSources } from "@/lib/plan/prompt";
import { planRequestSchema } from "@/lib/plan/requestSchema";
import { planOutputSchema, questionCountFor } from "@/lib/plan/schema";
import { getServerEnv } from "@/lib/server/env";
import { apiError, getClientIp, hashIdentifier, isSameOrigin, readJsonBody } from "@/lib/server/http";
import { checkRateLimit, releaseRateLimit } from "@/lib/server/rateLimit";

/**
 * POST /api/plan — PlanRequest (JSON) → PlanResponse.
 * Asks PLANNER_MODEL for a short structured plan sized to the interview length. Every question
 * keeps at least one traceable source. Stateless: nothing is stored, and bodies are never logged.
 */

export const maxDuration = 60;

const MAX_BODY_BYTES = 128 * 1024;
const WINDOW_MS = RATE_LIMITS.windowMinutes * 60 * 1000;
const AI_TIMEOUT_MS = 45_000;

export async function POST(request: Request): Promise<Response> {
  const env = getServerEnv();
  if (!env.aiEnabled) return apiError(503, "AI_DISABLED", "The demo is temporarily paused. Please try again later.");
  if (!env.openaiApiKey || !env.plannerModel) {
    const missing = [!env.openaiApiKey && "OPENAI_API_KEY", !env.plannerModel && "PLANNER_MODEL"].filter(Boolean);
    console.error("[api/plan] missing server configuration:", missing.join(", "));
    return apiError(500, "INTERNAL_ERROR", "Planning is not configured on the server.");
  }
  if (!isSameOrigin(request)) return apiError(403, "INVALID_INPUT", "Requests must come from the MockMate site.");

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) {
    return body.tooLarge
      ? apiError(413, "INPUT_TOO_LARGE", "The plan request is too large.")
      : apiError(400, "INVALID_INPUT", "The plan request is not valid JSON.");
  }
  const parsed = planRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return apiError(400, "INVALID_INPUT", "The plan request is missing data or has invalid values. Please run the analysis again.", {
      ...(typeof field === "string" ? { field } : {}),
    });
  }
  if (!isInterviewDuration(parsed.data.durationMinutes)) {
    return apiError(400, "INVALID_INPUT", `Choose an interview length of ${INTERVIEW_DURATIONS.join(" or ")} minutes.`, {
      field: "durationMinutes",
    });
  }
  const planRequest = { ...parsed.data, durationMinutes: parsed.data.durationMinutes };

  const ip = getClientIp(request);
  const ipKey = `plan:${ip}`;
  const limit = checkRateLimit(ipKey, RATE_LIMITS.analyzeOrPlanPerWindow, WINDOW_MS);
  if (!limit.allowed) {
    return apiError(429, "RATE_LIMITED", "You've generated several plans recently. Please wait a few minutes and try again.", {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const questionCount = questionCountFor(planRequest.durationMinutes, planRequest.mode);
  const sources = collectSources(planRequest);

  try {
    const output = await generateStructured({
      apiKey: env.openaiApiKey,
      model: env.plannerModel,
      name: "interview_plan",
      schema: planOutputSchema(planRequest.mode, questionCount),
      instructions: buildPlanInstructions(planRequest.mode, planRequest.companyStyle, questionCount, sources.evidence.length > 0),
      input: buildPlanInput(planRequest, sources),
      maxOutputTokens: 10_000,
      reasoningEffort: "low",
      safetyIdentifier: hashIdentifier(ip),
      timeoutMs: AI_TIMEOUT_MS,
    });

    const { plan, droppedQuestions } = buildInterviewPlan(planRequest, output, sources);
    if (droppedQuestions > 0) console.error("[api/plan] dropped questions without a valid source:", droppedQuestions);
    if (plan.questions.length < 2) {
      return apiError(502, "UPSTREAM_ERROR", "The plan came back incomplete. Please try again.");
    }
    const response: PlanResponse = { plan };
    return Response.json(response);
  } catch (error) {
    // Refund only when OpenAI rejected the request; timeouts and cut-off outputs were billed.
    if (error instanceof AiError && error.kind === "upstream") releaseRateLimit(ipKey, limit.slotId);
    if (error instanceof AiError) {
      if (error.kind === "timeout") return apiError(504, "UPSTREAM_ERROR", "Planning took too long. Please try again.");
      if (error.kind === "refusal") return apiError(422, "INVALID_INPUT", "This input couldn't be used to plan an interview.");
      return apiError(502, "UPSTREAM_ERROR", "The planning service had a problem. Please try again.");
    }
    console.error("[api/plan] unexpected error:", error instanceof Error ? error.name : "unknown");
    return apiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
  }
}
