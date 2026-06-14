import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readEnvFile, updateEnvFile } from './env-file.mjs';

const allowedRoles = new Set(['SUPER_ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER']);
const argumentsMap = new Map(
  process.argv
    .slice(2)
    .filter((argument) => argument.startsWith('--') && argument.includes('='))
    .map((argument) => {
      const separator = argument.indexOf('=');
      return [argument.slice(2, separator), argument.slice(separator + 1)];
    }),
);

const localEnv = await readEnvFile('.env.local').catch(() => ({}));
const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  localEnv.VITE_FIREBASE_PROJECT_ID;
const confirmedProject = argumentsMap.get('confirm-project');
const explicitEmail = argumentsMap.get('email')?.trim().toLowerCase();
const name = argumentsMap.get('name')?.trim();
const role = argumentsMap.get('role')?.trim().toUpperCase();
const phoneNumber = argumentsMap.get('phone')?.trim();
const normalizedPhone = normalizeIndonesianPhoneNumber(phoneNumber ?? '');
const writePilotUid = argumentsMap.get('write-pilot-uid') === 'true';
const email =
  explicitEmail ||
  (normalizedPhone ? `${normalizedPhone}@wa.peduli-pinrang.local` : undefined);

if (!projectId || confirmedProject !== projectId) {
  throw new Error(
    `Konfirmasi project wajib sama persis: --confirm-project=${projectId || '<project-id>'}`,
  );
}
if (!email || !name || !role || !allowedRoles.has(role)) {
  throw new Error(
    'Gunakan --email=... atau --phone=..., lalu --name=... --role=SUPER_ADMIN|OPERATOR|DRIVER|CUSTOMER.',
  );
}

const clientEmail =
  process.env.FIREBASE_CLIENT_EMAIL || localEnv.FIREBASE_CLIENT_EMAIL;
const privateKey = (
  process.env.FIREBASE_PRIVATE_KEY || localEnv.FIREBASE_PRIVATE_KEY
)?.replaceAll('\\n', '\n');
const credential =
  clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault();

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential, projectId });
const auth = getAuth(app);
const db = getFirestore(app);

let user;
try {
  user = await auth.getUserByEmail(email);
} catch (error) {
  if (error?.code !== 'auth/user-not-found') throw error;
  const password = process.env.BOOTSTRAP_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      'Set BOOTSTRAP_PASSWORD minimal 8 karakter untuk membuat akun baru.',
    );
  }
  user = await auth.createUser({
    email,
    password,
    displayName: name,
    disabled: false,
  });
}

await db.collection('users').doc(user.uid).set(
  {
    name,
    ...(explicitEmail ? { email } : {}),
    role,
    isActive: true,
    ...(normalizedPhone ? { phoneNumber: normalizedPhone } : {}),
  },
  { merge: true },
);

const pilotEnvKeys = {
  SUPER_ADMIN: 'PILOT_SUPER_ADMIN_UID',
  OPERATOR: 'PILOT_OPERATOR_UID',
  DRIVER: 'PILOT_DRIVER_UID',
};
const pilotEnvKey = pilotEnvKeys[role];
if (writePilotUid) {
  if (!pilotEnvKey) {
    throw new Error(
      '--write-pilot-uid=true hanya berlaku untuk SUPER_ADMIN, OPERATOR, atau DRIVER.',
    );
  }
  await updateEnvFile('.env.local', { [pilotEnvKey]: user.uid });
}

console.log(`Akun ${role} siap dengan UID ${user.uid}.`);
if (pilotEnvKey) {
  console.log(
    writePilotUid
      ? `${pilotEnvKey} diperbarui di .env.local.`
      : `Catat UID dengan ${pilotEnvKey}=${user.uid}, atau ulangi memakai --write-pilot-uid=true.`,
  );
}

function normalizeIndonesianPhoneNumber(value) {
  const digits = value.replaceAll(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}
