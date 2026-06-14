import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readEnvFile } from './env-file.mjs';

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

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replaceAll('\\n', '\n');
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

console.log(`Akun ${role} siap dengan UID ${user.uid}.`);

function normalizeIndonesianPhoneNumber(value) {
  const digits = value.replaceAll(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}
