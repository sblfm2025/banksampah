import { describe, expect, it } from 'vitest';
import { FixedWindowRateLimiter } from './rate-limiter';

describe('FixedWindowRateLimiter', () => {
  it('menolak request setelah limit tercapai', () => {
    const limiter = new FixedWindowRateLimiter(2, 60_000);

    expect(limiter.consume('source', 1_000).allowed).toBe(true);
    expect(limiter.consume('source', 2_000).allowed).toBe(true);
    expect(limiter.consume('source', 3_000)).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 58,
    });
  });

  it('membuka window baru setelah waktu reset', () => {
    const limiter = new FixedWindowRateLimiter(1, 1_000);
    limiter.consume('source', 1_000);

    expect(limiter.consume('source', 2_000)).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0,
    });
  });
});
