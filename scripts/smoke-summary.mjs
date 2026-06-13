import { readFile } from 'node:fs/promises';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  getCountFromServer,
  getFirestore,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';

const env = Object.fromEntries(
  (await readFile('.env.local', 'utf8'))
    .split(/\r?\n/u)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
if (!email || !password) {
  throw new Error('Set SMOKE_EMAIL dan SMOKE_PASSWORD untuk smoke test.');
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout setelah ${ms}ms`)), ms);
  });
}

await Promise.race([
  signInWithEmailAndPassword(getAuth(app), email, password),
  timeout(15_000),
]);

const tickets = collection(getFirestore(app), 'pickupRequests');
const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Makassar',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).formatToParts(new Date());
const dateParts = Object.fromEntries(
  parts
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, part.value]),
);
const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
const start = Timestamp.fromDate(new Date(`${today}T00:00:00+08:00`));
const end = Timestamp.fromDate(
  new Date(new Date(`${today}T00:00:00+08:00`).getTime() + 86_400_000),
);
const count = async (...constraints) =>
  (await getCountFromServer(query(tickets, ...constraints))).data().count;

const names = [
  'newToday',
  'needsInfo',
  'needsReview',
  'scheduledToday',
  'completedToday',
  'extraTrip',
  'watangSawitto',
  'paleteang',
];
const entries = await Promise.race([
  Promise.allSettled([
    count(
      where('status', '==', 'NEW'),
      where('createdAt', '>=', start),
      where('createdAt', '<', end),
    ),
    count(where('status', '==', 'NEEDS_INFO')),
    count(where('status', '==', 'NEEDS_OPERATOR_REVIEW')),
    count(where('scheduledDate', '==', today)),
    count(
      where('status', '==', 'COMPLETED'),
      where('completedAt', '>=', start),
      where('completedAt', '<', end),
    ),
    count(where('status', '==', 'EXTRA_TRIP_REQUIRED')),
    count(where('district', '==', 'WATANG_SAWITTO')),
    count(where('district', '==', 'PALETEANG')),
  ]),
  timeout(30_000),
]);

const values = entries.map((entry) =>
  entry.status === 'fulfilled' ? entry.value : 0,
);
const failed = entries.flatMap((entry, index) =>
  entry.status === 'rejected'
    ? [
        {
          name: names[index],
          code: entry.reason?.code ?? 'unknown',
          message: entry.reason?.message ?? String(entry.reason),
        },
      ]
    : [],
);
console.log(
  JSON.stringify({
    summaryUsable: true,
    pendingCounts: failed.length,
    failed,
    values,
  }),
);
process.exit(0);
