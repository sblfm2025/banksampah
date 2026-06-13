import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { readEnvFile } from './env-file.mjs';

const execFileAsync = promisify(execFile);
const values = await readEnvFile('.env.local');
const projectId = values.VITE_FIREBASE_PROJECT_ID;
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
  const userCount = Array.isArray(exported.users) ? exported.users.length : 0;
  check(
    'Akun Authentication',
    userCount >= 1,
    `${userCount} akun; driver tetap diperlukan untuk uji alur lapangan`,
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

for (const item of checks) {
  console.log(`${item.passed ? 'OK' : 'BELUM'}  ${item.name}: ${item.detail}`);
}

if (checks.some((item) => !item.passed)) {
  process.exitCode = 1;
} else {
  console.log('Produksi siap untuk build dan deployment.');
}
