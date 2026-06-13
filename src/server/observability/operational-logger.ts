export type OperationalEvent =
  | 'pickup_reminder_started'
  | 'pickup_reminder_completed'
  | 'pickup_reminder_failed'
  | 'readiness_checked';

export interface OperationalLogFields {
  requestId?: string;
  durationMs?: number;
  targetDate?: string;
  candidates?: number;
  sent?: number;
  skipped?: number;
  failed?: number;
  ready?: boolean;
  missingConfigCount?: number;
  errorName?: string;
}

export interface OperationalLogger {
  log(event: OperationalEvent, fields?: OperationalLogFields): void;
}

export class JsonOperationalLogger implements OperationalLogger {
  constructor(
    private readonly write: (line: string) => void = (line) =>
      console.info(line),
  ) {}

  log(event: OperationalEvent, fields: OperationalLogFields = {}) {
    this.write(
      JSON.stringify({
        severity: event.endsWith('_failed') ? 'ERROR' : 'INFO',
        event,
        timestamp: new Date().toISOString(),
        ...fields,
      }),
    );
  }
}
