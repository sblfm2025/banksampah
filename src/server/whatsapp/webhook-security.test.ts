import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  verifyWebhookChallenge,
  verifyWebhookSignature,
} from './webhook-security';

describe('WhatsApp webhook security', () => {
  it('mengembalikan challenge untuk verify token yang benar', () => {
    expect(
      verifyWebhookChallenge(
        {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'token-benar',
          'hub.challenge': '12345',
        },
        'token-benar',
      ),
    ).toBe('12345');
  });

  it('menolak verify token yang salah', () => {
    expect(
      verifyWebhookChallenge(
        {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'salah',
          'hub.challenge': '12345',
        },
        'token-benar',
      ),
    ).toBeNull();
  });

  it('memvalidasi signature raw body', () => {
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    const signature = createHmac('sha256', 'app-secret')
      .update(body)
      .digest('hex');

    expect(
      verifyWebhookSignature(body, `sha256=${signature}`, 'app-secret'),
    ).toBe(true);
    expect(
      verifyWebhookSignature(body, `sha256=${'0'.repeat(64)}`, 'app-secret'),
    ).toBe(false);
    expect(
      verifyWebhookSignature(body, `sha256=${'z'.repeat(64)}`, 'app-secret'),
    ).toBe(false);
  });
});
