/**
 * Fixed-window, in-process rate limiter.
 *
 * Deliberately not Redis, not Upstash, not a package. RER runs as a single
 * Next.js instance on Railway, so a module-level Map is the same thing a
 * shared store would be, minus a network round trip on every public form
 * submission and minus a dependency. The limits below are also low-stakes: the
 * cost of being wrong is one extra enquiry row, not a security boundary.
 *
 * What this does NOT survive: a redeploy, a restart, or a second instance. If
 * the app is ever scaled horizontally, a flooder gets `instances x limit`
 * rather than `limit`. That is an acceptable ceiling for a contact form and a
 * deliberate trade — revisit it only if the app is actually scaled out.
 *
 * The real protection against a determined attacker is not here; it is that
 * the endpoint writes one narrow, explicitly-constructed record and exposes
 * nothing back. This exists to stop an unattended script filling the CMS.
 */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

/**
 * Bound the Map so a stream of unique keys (spoofed `x-forwarded-for` values)
 * cannot grow it without limit. Expired windows are dropped first; if every
 * window is still live, the oldest are evicted.
 */
const MAX_TRACKED_KEYS = 5000;

function sweep(now: number) {
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) {
      buckets.delete(key);
    }
  }

  if (buckets.size <= MAX_TRACKED_KEYS) {
    return;
  }

  const byExpiry = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
  for (const [key] of byExpiry.slice(0, buckets.size - MAX_TRACKED_KEYS)) {
    buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the caller may retry. Only meaningful when `allowed` is false. */
  retryAfter: number;
};

/**
 * @param key    Caller identity — see `clientKey()`.
 * @param limit  Requests permitted per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true, retryAfter: 0 };
}

/**
 * Best-effort caller identity.
 *
 * `x-forwarded-for` is trivially spoofable in general, but behind Railway's
 * proxy the left-most entry is the value the edge observed, and a spoofed
 * header only ever moves the attacker into a *different* bucket rather than
 * out of rate limiting altogether. Everything unidentifiable shares one
 * bucket, which is the conservative direction to fail in.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown';

  return `${scope}:${ip}`;
}
