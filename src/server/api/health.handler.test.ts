import type { Firestore } from 'firebase-admin/firestore';
import { describe, expect, it, vi } from 'vitest';
import { HealthService } from '../observability/health.service';
import { HealthApiHandler } from './health.handler';

function fakeDb(fails = false): Firestore {
  return {
    collection: () => ({
      limit: () => ({
        get: async () => {
          if (fails) throw new Error('firestore unavailable');
          return { empty: true };
        },
      }),
    }),
  } as unknown as Firestore;
}

const productionEnv = {
  APP_ENV: 'production',
  FIREBASE_PROJECT_ID: 'project',
  FIREBASE_STORAGE_BUCKET: 'bucket',
  GEMINI_API_KEY: 'configured',
  WHATSAPP_APP_SECRET: 'configured',
  WHATSAPP_VERIFY_TOKEN: 'configured',
  WHATSAPP_ACCESS_TOKEN: 'configured',
  WHATSAPP_PHONE_NUMBER_ID: 'configured',
};

describe('HealthApiHandler', () => {
  it('mengembalikan liveness tanpa memeriksa dependency', () => {
    const handler = new HealthApiHandler(
      new HealthService(fakeDb(true), productionEnv),
    );

    expect(handler.liveness()).toMatchObject({
      status: 200,
      body: { status: 'ok' },
      headers: { 'Cache-Control': 'no-store' },
    });
  });

  it('mengembalikan ready ketika konfigurasi dan Firestore sehat', async () => {
    const logger = { log: vi.fn() };
    const handler = new HealthApiHandler(
      new HealthService(fakeDb(), productionEnv),
      logger,
    );

    const response = await handler.readiness('request-health');

    expect(response).toMatchObject({
      status: 200,
      body: {
        status: 'ready',
        checks: { configuration: true, firestore: true },
      },
    });
    expect(logger.log).toHaveBeenCalledWith('readiness_checked', {
      requestId: 'request-health',
      ready: true,
      missingConfigCount: 0,
    });
  });

  it('mengembalikan 503 tanpa membocorkan nilai konfigurasi', async () => {
    const handler = new HealthApiHandler(
      new HealthService(fakeDb(true), { APP_ENV: 'production' }),
      { log: vi.fn() },
    );

    const response = await handler.readiness();
    const serialized = JSON.stringify(response);

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: 'not_ready',
      checks: { configuration: false, firestore: false },
    });
    expect(serialized).not.toContain('configured');
  });
});
