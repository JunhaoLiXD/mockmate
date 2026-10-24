/**
 * In-memory sliding-window limiter. Best effort only: serverless instances do not share
 * memory, so limits are per instance and reset on cold start (accepted in brief section 5.3).
 */

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
    return { allowed: false, retryAfterSeconds };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Releases the most recent slot, e.g. when the upstream call failed and should not count. */
export function releaseRateLimit(key: string): void {
  const recent = buckets.get(key);
  if (recent?.length) recent.pop();
}
