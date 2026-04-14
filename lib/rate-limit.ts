/**
 * Simple in-memory rate limiter keyed by user ID.
 *
 * Good for per-instance protection. Since Vercel runs multiple
 * serverless instances, this is "best effort" — a determined attacker
 * could get past it by hitting different instances. For production-grade
 * rate limiting, use a shared store (Redis / Upstash). This is sufficient
 * to prevent accidental abuse and most casual scraping.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Returns true if the request should be allowed, false if rate-limited.
 * Cleans up stale buckets opportunistically.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const newBucket: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, newBucket);

    // Opportunistic cleanup of stale buckets (every ~100 calls)
    if (Math.random() < 0.01) {
      buckets.forEach((b, k) => {
        if (b.resetAt <= now) buckets.delete(k);
      });
    }

    return { allowed: true, remaining: limit - 1, resetAt: newBucket.resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count++;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Returns a Response if rate-limited, null if allowed.
 */
export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): Response | null {
  const result = checkRateLimit(key, options.limit, options.windowMs);
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        resetAt: new Date(result.resetAt).toISOString(),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(options.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }
  return null;
}
