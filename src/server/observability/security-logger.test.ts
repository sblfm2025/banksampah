import { describe, expect, it, vi } from 'vitest';
import { JsonSecurityLogger } from './security-logger';

describe('JsonSecurityLogger', () => {
  it('mencatat metadata allowlist dan menghash source key', () => {
    const write = vi.fn();
    const logger = new JsonSecurityLogger(write);

    logger.log('webhook_invalid_signature', {
      requestId: 'request-1',
      sourceKey: '628123456789',
      bodyBytes: 128,
    });

    const record = JSON.parse(write.mock.calls[0][0]) as Record<
      string,
      unknown
    >;
    expect(record).toMatchObject({
      severity: 'WARNING',
      event: 'webhook_invalid_signature',
      requestId: 'request-1',
      bodyBytes: 128,
    });
    expect(record.sourceHash).not.toBe('628123456789');
    expect(JSON.stringify(record)).not.toContain('628123456789');
    expect(record).not.toHaveProperty('rawBody');
    expect(record).not.toHaveProperty('signature');
  });
});
