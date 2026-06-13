import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as observeAuthState,
} from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { appUserSchema, type AppUser } from '../shared/schemas/user.schema';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Konfigurasi Firebase Web belum lengkap.');
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = getAuth(app);
export const onAuthStateChanged = observeAuthState;

export async function loginWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  await signOut(auth);
}

export async function getFirebaseIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sesi login tidak tersedia.');
  return user.getIdToken();
}

export async function initializeAnalytics(): Promise<void> {
  if (!firebaseConfig.measurementId) return;

  const { getAnalytics, isSupported } = await import('firebase/analytics');
  if (await isSupported()) getAnalytics(app);
}

export async function getAppUser(uid: string): Promise<AppUser | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists()
    ? appUserSchema.parse({ id: snapshot.id, ...snapshot.data() })
    : null;
}
