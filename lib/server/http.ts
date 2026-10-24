import { createHash } from "node:crypto";
import type { ApiErrorBody, ApiErrorCode } from "@/types";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  extra: Omit<ApiErrorBody["error"], "code" | "message"> = {},
): Response {
  const body: ApiErrorBody = { error: { code, message, ...extra } };
  const headers: HeadersInit = extra.retryAfterSeconds
    ? { "Retry-After": String(extra.retryAfterSeconds) }
    : {};
  return Response.json(body, { status, headers });
}

/** Best-effort client IP. On Vercel the first x-forwarded-for entry is the client. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Stable, non-reversible identifier for OpenAI safety tracking. Never send raw IPs. */
export function hashIdentifier(value: string): string {
  return createHash("sha256").update(`mockmate:${value}`).digest("hex").slice(0, 32);
}

/**
 * Rejects cross-site requests. Browsers always send Origin on POST fetches, so a missing
 * Origin means a non-browser client. This is abuse friction, not authentication.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Reads a JSON body with a byte cap, without trusting Content-Length alone. */
export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; tooLarge: boolean }> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return { ok: false, tooLarge: true };
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) return { ok: false, tooLarge: true };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, tooLarge: false };
  }
}
