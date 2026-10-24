/**
 * Browser-side calls to the MockMate API routes. Components use these instead of calling fetch,
 * so error handling matches the ApiErrorBody contract everywhere.
 */

import type {
  AnalyzeFormFields,
  AnalyzeResponse,
  ApiErrorBody,
  ApiErrorCode,
  PlanRequest,
  PlanResponse,
} from "@/types";
import { API_ROUTES } from "@/types";

/** Analysis and planning each take about 20 seconds; the server gives up after 60. */
const REQUEST_TIMEOUT_MS = 75_000;

export class ApiClientError extends Error {
  constructor(
    readonly code: ApiErrorCode | "NETWORK_ERROR" | "TIMEOUT",
    message: string,
    readonly field?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null && "error" in value && typeof (value as ApiErrorBody).error?.message === "string";
}

async function request<T>(url: string, init: RequestInit, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  // AbortSignal.any is missing in older Safari; fall back to the caller's signal there.
  const combined = signal ? (typeof AbortSignal.any === "function" ? AbortSignal.any([signal, timeout]) : signal) : timeout;

  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: combined });
  } catch (error) {
    if (signal?.aborted) throw error; // cancelled by the caller
    if (timeout.aborted) throw new ApiClientError("TIMEOUT", "This is taking longer than expected. Please try again.");
    throw new ApiClientError("NETWORK_ERROR", "We couldn't reach MockMate. Check your connection and try again.");
  }

  const body: unknown = await response.json().catch(() => null);
  if (response.ok && body !== null) return body as T;
  if (isErrorBody(body)) {
    const { code, message, field, retryAfterSeconds } = body.error;
    throw new ApiClientError(code, message, field, retryAfterSeconds);
  }
  throw new ApiClientError("INTERNAL_ERROR", "Something went wrong. Please try again.");
}

export function analyzeProfile(fields: AnalyzeFormFields, signal?: AbortSignal): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.set("jobDescription", fields.jobDescription);
  form.set("companyStyle", fields.companyStyle);
  form.set("mode", fields.mode);
  if (fields.resumeFile) form.set("resumeFile", fields.resumeFile);
  else if (fields.resumeText) form.set("resumeText", fields.resumeText);
  if (fields.repoUrl) form.set("repoUrl", fields.repoUrl);
  return request<AnalyzeResponse>(API_ROUTES.analyze, { method: "POST", body: form }, signal);
}

export function createPlan(body: PlanRequest, signal?: AbortSignal): Promise<PlanResponse> {
  return request<PlanResponse>(
    API_ROUTES.plan,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    signal,
  );
}

/** A user-facing message for any error thrown by the calls above. */
export function describeApiError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.retryAfterSeconds) {
      const minutes = Math.ceil(error.retryAfterSeconds / 60);
      return `${error.message} (Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.)`;
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
