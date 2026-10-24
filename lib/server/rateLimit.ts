/**
 * In-memory sliding-window limiter. Best effort only: serverless instances do not share
 * memory, so limits are per instance and reset on cold start (accepted in brief section 5.3).
 */

interface Slot {
  id: number;
  at: number;
}

const buckets = new Map<string, Slot[]>();
let nextSlotId = 1;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  /** Identifies the slot this request used; pass it to releaseRateLimit. 0 when not allowed. */
  slotId: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const recent = (buckets.get(key) ?? []).filter((slot) => now - slot.at < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - recent[0].at)) / 1000));
    return { allowed: false, retryAfterSeconds, slotId: 0 };
  }
  const slotId = nextSlotId++;
  recent.push({ id: slotId, at: now });
  buckets.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0, slotId };
}

/**
 * Gives back exactly this request's slot. Only call it when no paid work happened, e.g. the
 * upstream API rejected the request. Timeouts and cut-off outputs have already cost money.
 */
export function releaseRateLimit(key: string, slotId: number): void {
  const recent = buckets.get(key);
  if (!recent || slotId === 0) return;
  const index = recent.findIndex((slot) => slot.id === slotId);
  if (index !== -1) recent.splice(index, 1);
}
