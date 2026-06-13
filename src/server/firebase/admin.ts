import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function decodePrivateKey(value: string): string {
  return value.replaceAll('\\n', '\n');
}

export function getAdminApp() {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? 'sampahta-pinrang-local';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId });
  }

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: decodePrivateKey(privateKey),
      }),
      projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const adminDb = getFirestore(getAdminApp());
adminDb.settings({ ignoreUndefinedProperties: true });
