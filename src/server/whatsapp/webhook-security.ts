import { createHmac, timingSafeEqual } from 'node:crypto';

export interface WebhookVerificationQuery {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
}

export function verifyWebhookChallenge(
  query: WebhookVerificationQuery,
  expectedToken: string,
): string | null {
  if (
    query['hub.mode'] !== 'subscribe' ||
    query['hub.verify_token'] !== expectedToken
  ) {
    return null;
  }

  return query['hub.challenge'] ?? null;
}

export function verifyWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=') || !appSecret) {
    return false;
  }

  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const received = signatureHeader.slice('sha256='.length);

  if (!/^[a-f0-9]{64}$/i.test(received)) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(received, 'hex'),
    Buffer.from(expected, 'hex'),
  );
}
