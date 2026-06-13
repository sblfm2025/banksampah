import type { WhatsAppIntakeService } from '../whatsapp/intake.service';
import {
  JsonSecurityLogger,
  type SecurityLogger,
} from '../observability/security-logger';
import {
  FixedWindowRateLimiter,
  type RateLimiter,
} from '../security/rate-limiter';
import {
  verifyWebhookChallenge,
  verifyWebhookSignature,
  type WebhookVerificationQuery,
} from '../whatsapp/webhook-security';

export interface WebhookResponse {
  status: number;
  body:
    | string
    | { received: true; processed: number }
    | { received: false; retryAfterSeconds: number };
  headers?: Record<string, string>;
}

export interface WebhookPostOptions {
  sourceKey?: string;
  requestId?: string;
  maxBodyBytes?: number;
  rateLimiter?: RateLimiter;
  logger?: SecurityLogger;
}

function positiveIntegerEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

const defaultRateLimiter = new FixedWindowRateLimiter(
  positiveIntegerEnv('WHATSAPP_WEBHOOK_RATE_LIMIT', 120),
  positiveIntegerEnv('WHATSAPP_WEBHOOK_RATE_WINDOW_MS', 60_000),
);
const defaultMaxBodyBytes = positiveIntegerEnv(
  'WHATSAPP_WEBHOOK_MAX_BODY_BYTES',
  1_048_576,
);
const defaultLogger = new JsonSecurityLogger();

export function handleWhatsAppWebhookVerification(
  query: WebhookVerificationQuery,
  verifyToken: string,
): WebhookResponse {
  const challenge = verifyWebhookChallenge(query, verifyToken);
  return challenge
    ? { status: 200, body: challenge }
    : { status: 403, body: 'Forbidden' };
}

export async function handleWhatsAppWebhookPost(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
  intakeService: WhatsAppIntakeService,
  options: WebhookPostOptions = {},
): Promise<WebhookResponse> {
  const sourceKey = options.sourceKey ?? 'whatsapp-webhook';
  const logger = options.logger ?? defaultLogger;
  const fields = {
    requestId: options.requestId,
    sourceKey,
    bodyBytes: rawBody.byteLength,
  };

  if (rawBody.byteLength > (options.maxBodyBytes ?? defaultMaxBodyBytes)) {
    logger.log('webhook_payload_too_large', fields);
    return { status: 413, body: 'Payload too large' };
  }

  if (!verifyWebhookSignature(rawBody, signatureHeader, appSecret)) {
    logger.log('webhook_invalid_signature', fields);
    return { status: 401, body: 'Invalid signature' };
  }

  const limit = (options.rateLimiter ?? defaultRateLimiter).consume(sourceKey);
  if (!limit.allowed) {
    logger.log('webhook_rate_limited', {
      ...fields,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return {
      status: 429,
      body: {
        received: false,
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      headers: { 'Retry-After': String(limit.retryAfterSeconds) },
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    logger.log('webhook_invalid_json', fields);
    return { status: 400, body: 'Invalid JSON' };
  }

  try {
    const results = await intakeService.processWebhook(payload);
    logger.log('webhook_processed', {
      ...fields,
      processed: results.length,
    });
    return {
      status: 200,
      body: { received: true, processed: results.length },
    };
  } catch (error) {
    logger.log('webhook_processing_failed', {
      ...fields,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return { status: 500, body: 'Processing failed' };
  }
}
