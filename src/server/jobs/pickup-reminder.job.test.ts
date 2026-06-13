import { describe, expect, it, vi } from 'vitest';
import { runPickupReminderJob } from './pickup-reminder.job';

describe('runPickupReminderJob', () => {
  it('meneruskan waktu scheduler ke reminder service', async () => {
    const now = new Date('2026-06-13T00:00:00.000Z');
    const result = {
      targetDate: '2026-06-14',
      candidates: 1,
      sent: 1,
      skipped: 0,
      failed: 0,
    };
    const service = { run: vi.fn().mockResolvedValue(result) };
    const logger = { log: vi.fn() };

    await expect(runPickupReminderJob(now, service, logger)).resolves.toEqual(
      result,
    );
    expect(service.run).toHaveBeenCalledWith(now);
    expect(logger.log).toHaveBeenCalledWith('pickup_reminder_started');
    expect(logger.log).toHaveBeenCalledWith(
      'pickup_reminder_completed',
      expect.objectContaining(result),
    );
  });

  it('mencatat kegagalan dan tetap melempar error', async () => {
    const error = new TypeError('provider failed');
    const service = { run: vi.fn().mockRejectedValue(error) };
    const logger = { log: vi.fn() };

    await expect(
      runPickupReminderJob(new Date(), service, logger),
    ).rejects.toBe(error);
    expect(logger.log).toHaveBeenCalledWith(
      'pickup_reminder_failed',
      expect.objectContaining({ errorName: 'TypeError' }),
    );
  });
});
