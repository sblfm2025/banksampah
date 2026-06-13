import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  handleWhatsAppWebhookPost,
  handleWhatsAppWebhookVerification,
} from './whatsapp-webhook.handler';
import { FixedWindowRateLimiter } from '../security/rate-limiter';

function signatureFor(rawBody: Buffer) {
  return `sha256=${createHmac('sha256', 'secret')
    .update(rawBody)
    .digest('hex')}`;
}

function logger() {
  return { log: vi.fn() };
}

describe('WhatsApp webhook handler', () => {
  it('menangani verifikasi GET', () => {
    expect(
      handleWhatsAppWebhookVerification(
        {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'token',
          'hub.challenge': 'challenge-value',
        },
        'token',
      ),
    ).toEqual({ status: 200, body: 'challenge-value' });
  });

  it('menolak POST sebelum parsing ketika signature salah', async () => {
    const intake = { processWebhook: vi.fn() };
    const result = await handleWhatsAppWebhookPost(
      Buffer.from('{}'),
      'sha256=invalid',
      'secret',
      intake as never,
      { logger: logger() },
    );

    expect(result.status).toBe(401);
    expect(intake.processWebhook).not.toHaveBeenCalled();
  });

  it('memproses JSON setelah signature valid', async () => {
    const rawBody = Buffer.from(
      JSON.stringify({ object: 'whatsapp_business_account', entry: [] }),
    );
    const intake = {
      processWebhook: vi.fn().mockResolvedValue([]),
    };

    const result = await handleWhatsAppWebhookPost(
      rawBody,
      signatureFor(rawBody),
      'secret',
      intake as never,
      { logger: logger() },
    );

    expect(result).toEqual({
      status: 200,
      body: { received: true, processed: 0 },
    });
    expect(intake.processWebhook).toHaveBeenCalledOnce();
  });

  it('menolak payload terlalu besar sebelum verifikasi dan parsing', async () => {
    const rawBody = Buffer.from('{"phone":"628123456789"}');
    const intake = { processWebhook: vi.fn() };
    const securityLogger = logger();

    const result = await handleWhatsAppWebhookPost(
      rawBody,
      signatureFor(rawBody),
      'secret',
      intake as never,
      { maxBodyBytes: 5, logger: securityLogger },
    );

    expect(result).toEqual({ status: 413, body: 'Payload too large' });
    expect(intake.processWebhook).not.toHaveBeenCalled();
    expect(securityLogger.log).toHaveBeenCalledWith(
      'webhook_payload_too_large',
      expect.not.objectContaining({ rawBody: expect.anything() }),
    );
  });

  it('mengembalikan 429 dan Retry-After ketika kuota habis', async () => {
    const rawBody = Buffer.from(
      JSON.stringify({ object: 'whatsapp_business_account', entry: [] }),
    );
    const intake = { processWebhook: vi.fn().mockResolvedValue([]) };
    const limiter = new FixedWindowRateLimiter(1, 60_000);
    const securityLogger = logger();
    const options = {
      sourceKey: 'meta-webhook',
      rateLimiter: limiter,
      logger: securityLogger,
    };

    await handleWhatsAppWebhookPost(
      rawBody,
      signatureFor(rawBody),
      'secret',
      intake as never,
      options,
    );
    const limited = await handleWhatsAppWebhookPost(
      rawBody,
      signatureFor(rawBody),
      'secret',
      intake as never,
      options,
    );

    expect(limited.status).toBe(429);
    expect(limited.headers?.['Retry-After']).toBeDefined();
    expect(intake.processWebhook).toHaveBeenCalledOnce();
  });

  it('tidak menghabiskan kuota untuk signature invalid', async () => {
    const rawBody = Buffer.from('{}');
    const intake = { processWebhook: vi.fn().mockResolvedValue([]) };
    const limiter = new FixedWindowRateLimiter(1, 60_000);
    const options = { rateLimiter: limiter, logger: logger() };

    await handleWhatsAppWebhookPost(
      rawBody,
      'sha256=invalid',
      'secret',
      intake as never,
      options,
    );
    const valid = await handleWhatsAppWebhookPost(
      rawBody,
      signatureFor(rawBody),
      'secret',
      intake as never,
      options,
    );

    expect(valid.status).toBe(200);
  });

  it('menyembunyikan detail error pemrosesan dari response', async () => {
    const rawBody = Buffer.from('{}');
    const intake = {
      processWebhook: vi.fn().mockRejectedValue(new Error('token rahasia')),
    };
    const securityLogger = logger();

    const result = await handleWhatsAppWebhookPost(
      rawBody,
      signatureFor(rawBody),
      'secret',
      intake as never,
      { logger: securityLogger },
    );

    expect(result).toEqual({ status: 500, body: 'Processing failed' });
    expect(JSON.stringify(result)).not.toContain('token rahasia');
    expect(securityLogger.log).toHaveBeenCalledWith(
      'webhook_processing_failed',
      expect.objectContaining({ errorName: 'Error' }),
    );
  });
});
