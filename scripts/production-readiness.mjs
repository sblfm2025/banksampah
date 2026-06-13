import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readEnvFile } from './env-file.mjs';

const execFileAsync = promisify(execFile);
const values = await readEnvFile('.env.local');
const projectId = values.VITE_FIREBASE_PROJECT_ID;
const pilotRoles = [
  ['SUPER_ADMIN', values.PILOT_SUPER_ADMIN_UID],
  ['OPERATOR', values.PILOT_OPERATOR_UID],
  ['DRIVER', values.PILOT_DRIVER_UID],
];
const checks = [];

function check(name, passed, detail) {
  checks.push({ name, passed, detail });
}

check(
  'Firebase project',
  projectId === 'peduli-pinrang',
  projectId || 'belum dikonfigurasi',
);
check(
  'Data provider',
  values.VITE_DATA_PROVIDER === 'firestore',
  values.VITE_DATA_PROVIDER || 'belum dikonfigurasi',
);
check(
  'Media provider',
  values.VITE_PROOF_MEDIA_PROVIDER === 'firestore',
  values.VITE_PROOF_MEDIA_PROVIDER || 'belum dikonfigurasi',
);
check(
  'Mode produksi',
  values.VITE_USE_DEMO_DATA === 'false',
  values.VITE_USE_DEMO_DATA === 'false'
    ? 'aktif'
    : 'mode demo masih aktif',
);
check(
  'Environment aplikasi',
  values.VITE_APP_ENV === 'production' ||
    values.VITE_APP_ENV === 'staging',
  values.VITE_APP_ENV || 'VITE_APP_ENV belum dikonfigurasi',
);

const configuredPilotUids = pilotRoles.filter(([, uid]) => Boolean(uid));
check(
  'UID role pilot',
  configuredPilotUids.length === pilotRoles.length &&
    new Set(configuredPilotUids.map(([, uid]) => uid)).size ===
      pilotRoles.length,
  `${configuredPilotUids.length}/${pilotRoles.length} role dikonfigurasi`,
);

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'sampahta-auth-'));
const exportPath = join(temporaryDirectory, 'users.json');
try {
  const commandArguments = [
    'auth:export',
    exportPath,
    '--project',
    'production',
    '--format=json',
  ];
  if (process.platform === 'win32') {
    await execFileAsync(
      'cmd.exe',
      ['/d', '/s', '/c', 'firebase', ...commandArguments],
      { windowsHide: true },
    );
  } else {
    await execFileAsync('firebase', commandArguments);
  }
  const exported = JSON.parse(await readFile(exportPath, 'utf8'));
  const users = Array.isArray(exported.users) ? exported.users : [];
  const authUids = new Set(users.map((user) => user.localId));
  check(
    'Akun Authentication',
    configuredPilotUids.length === pilotRoles.length &&
      configuredPilotUids.every(([, uid]) => authUids.has(uid)),
    `${users.length} akun; ${configuredPilotUids.filter(([, uid]) => authUids.has(uid)).length}/${pilotRoles.length} UID pilot ditemukan`,
  );
} catch (error) {
  check(
    'Akun Authentication',
    false,
    `tidak dapat diperiksa: ${error.message}`,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

const clientEmail = values.FIREBASE_CLIENT_EMAIL;
const privateKey = values.FIREBASE_PRIVATE_KEY?.replaceAll('\\n', '\n');
if (clientEmail && privateKey && configuredPilotUids.length === pilotRoles.length) {
  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    }
    const firestore = getFirestore();
    const profiles = await Promise.all(
      pilotRoles.map(async ([role, uid]) => {
        const snapshot = await firestore.collection('users').doc(uid).get();
        return {
          role,
          exists: snapshot.exists,
          actualRole: snapshot.get('role'),
          isActive: snapshot.get('isActive') === true,
        };
      }),
    );
    check(
      'Profil role Firestore',
      profiles.every(
        (profile) =>
          profile.exists &&
          profile.actualRole === profile.role &&
          profile.isActive,
      ),
      `${profiles.filter((profile) => profile.exists && profile.actualRole === profile.role && profile.isActive).length}/${pilotRoles.length} profil aktif dan sesuai`,
    );
  } catch (error) {
    check(
      'Profil role Firestore',
      false,
      `gagal diperiksa: ${error.message}`,
    );
  }
} else {
  check(
    'Profil role Firestore',
    false,
    'isi FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, dan tiga PILOT_*_UID untuk verifikasi',
  );
}

for (const item of checks) {
  console.log(`${item.passed ? 'OK' : 'BELUM'}  ${item.name}: ${item.detail}`);
}

if (checks.some((item) => !item.passed)) {
  process.exitCode = 1;
} else {
  console.log('Produksi siap untuk build dan deployment.');
}
