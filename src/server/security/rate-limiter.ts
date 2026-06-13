export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  consume(key: string, now?: number): RateLimitDecision;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

export class FixedWindowRateLimiter implements RateLimiter {
  private readonly entries = new Map<string, WindowEntry>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {
    if (!Number.isInteger(limit) || limit < 1 || windowMs < 1) {
      throw new Error('Konfigurasi rate limiter tidak valid.');
    }
  }

  consume(key: string, now = Date.now()): RateLimitDecision {
    this.cleanup(now);
    const current = this.entries.get(key);
    const entry =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + this.windowMs }
        : current;

    if (entry.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((entry.resetAt - now) / 1000),
        ),
      };
    }

    entry.count += 1;
    this.entries.set(key, entry);
    return {
      allowed: true,
      remaining: this.limit - entry.count,
      retryAfterSeconds: 0,
    };
  }

  private cleanup(now: number) {
    if (this.entries.size < 1000) return;
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}
