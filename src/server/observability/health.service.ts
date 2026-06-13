import type { Firestore } from 'firebase-admin/firestore';
import { adminDb } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';

const REQUIRED_PRODUCTION_ENV = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'GEMINI_API_KEY',
  'WHATSAPP_APP_SECRET',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
] as const;

export interface LivenessResult {
  status: 'ok';
  uptimeSeconds: number;
}

export interface ReadinessResult {
  status: 'ready' | 'not_ready';
  checks: {
    configuration: boolean;
    firestore: boolean;
  };
  missingConfiguration: string[];
}

export class HealthService {
  constructor(
    private readonly db: Firestore = adminDb,
    private readonly env: NodeJS.ProcessEnv = process.env,
  ) {}

  liveness(): LivenessResult {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async readiness(): Promise<ReadinessResult> {
    const production = this.env.APP_ENV === 'production';
    const missingConfiguration = production
      ? REQUIRED_PRODUCTION_ENV.filter((name) => !this.env[name]?.trim())
      : [];
    let firestore: boolean;

    try {
      await this.db.collection(COLLECTIONS.pickupRequests).limit(1).get();
      firestore = true;
    } catch {
      firestore = false;
    }

    const configuration = missingConfiguration.length === 0;
    return {
      status: configuration && firestore ? 'ready' : 'not_ready',
      checks: { configuration, firestore },
      missingConfiguration,
    };
  }
}
