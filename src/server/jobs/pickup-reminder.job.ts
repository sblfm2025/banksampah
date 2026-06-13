import { createPickupReminderService } from '../runtime/composition';
import {
  JsonOperationalLogger,
  type OperationalLogger,
} from '../observability/operational-logger';
import type {
  PickupReminderResult,
  PickupReminderService,
} from '../services/pickup-reminder.service';

export async function runPickupReminderJob(
  now = new Date(),
  service?: Pick<PickupReminderService, 'run'>,
  logger: OperationalLogger = new JsonOperationalLogger(),
): Promise<PickupReminderResult> {
  const startedAt = Date.now();
  logger.log('pickup_reminder_started');

  try {
    const result = await (service ?? createPickupReminderService()).run(now);
    logger.log('pickup_reminder_completed', {
      durationMs: Date.now() - startedAt,
      ...result,
    });
    return result;
  } catch (error) {
    logger.log('pickup_reminder_failed', {
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    throw error;
  }
}
