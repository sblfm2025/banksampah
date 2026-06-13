import { describe, expect, it, vi } from 'vitest';
import { JsonOperationalLogger } from './operational-logger';

describe('JsonOperationalLogger', () => {
  it('menulis event JSON dengan field operasional', () => {
    const write = vi.fn();
    const logger = new JsonOperationalLogger(write);

    logger.log('pickup_reminder_completed', {
      durationMs: 120,
      sent: 3,
      failed: 1,
    });

    expect(JSON.parse(write.mock.calls[0][0])).toMatchObject({
      severity: 'INFO',
      event: 'pickup_reminder_completed',
      durationMs: 120,
      sent: 3,
      failed: 1,
    });
  });
});
