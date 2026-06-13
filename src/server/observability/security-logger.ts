import { createHash } from 'node:crypto';

export type SecurityEvent =
  | 'webhook_invalid_signature'
  | 'webhook_payload_too_large'
  | 'webhook_rate_limited'
  | 'webhook_invalid_json'
  | 'webhook_processed'
  | 'webhook_processing_failed';

export interface SecurityLogFields {
  requestId?: string;
  sourceKey?: string;
  bodyBytes?: number;
  processed?: number;
  retryAfterSeconds?: number;
  errorName?: string;
}

export interface SecurityLogger {
  log(event: SecurityEvent, fields?: SecurityLogFields): void;
}

export class JsonSecurityLogger implements SecurityLogger {
  constructor(
    private readonly write: (line: string) => void = (line) =>
      console.info(line),
  ) {}

  log(event: SecurityEvent, fields: SecurityLogFields = {}) {
    this.write(
      JSON.stringify({
        severity: severityFor(event),
        event,
        timestamp: new Date().toISOString(),
        requestId: fields.requestId,
        sourceHash: fields.sourceKey
          ? createHash('sha256')
              .update(fields.sourceKey)
              .digest('hex')
              .slice(0, 16)
          : undefined,
        bodyBytes: fields.bodyBytes,
        processed: fields.processed,
        retryAfterSeconds: fields.retryAfterSeconds,
        errorName: fields.errorName,
      }),
    );
  }
}

function severityFor(event: SecurityEvent) {
  if (event === 'webhook_processing_failed') return 'ERROR';
  if (event === 'webhook_processed') return 'INFO';
  return 'WARNING';
}
