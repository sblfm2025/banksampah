import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged as observeAuthState,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  appUserSchema,
  type AppUser,
  type CustomerProfileInput,
} from '../shared/schemas/user.schema';

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

const phoneLoginEmailDomain =
  import.meta.env.VITE_PHONE_LOGIN_EMAIL_DOMAIN ?? 'wa.peduli-pinrang.local';

function normalizeIndonesianPhoneNumber(value: string): string {
  const digits = value.replaceAll(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function phoneNumberToLoginEmail(phoneNumber: string): string {
  const normalized = normalizeIndonesianPhoneNumber(phoneNumber);
  if (!/^628\d{7,12}$/.test(normalized)) {
    throw new Error('Nomor WhatsApp tidak valid.');
  }

  return `${normalized}@${phoneLoginEmailDomain}`;
}

export async function loginWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string) {
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithWhatsAppNumber(
  phoneNumber: string,
  password: string,
) {
  await signInWithEmailAndPassword(
    auth,
    phoneNumberToLoginEmail(phoneNumber),
    password,
  );
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
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

export async function saveCustomerAppProfile(
  profile: CustomerProfileInput,
): Promise<void> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    throw new Error('Sesi login tidak tersedia.');
  }
  const email = firebaseUser.email ?? undefined;

  const reference = doc(db, 'users', firebaseUser.uid);
  const existing = await getDoc(reference);
  await setDoc(
    reference,
    {
      name: profile.fullName.trim(),
      ...(email ? { email } : {}),
      phoneNumber: profile.phoneNumber,
      role: 'CUSTOMER',
      isActive: true,
      addressText: profile.address.trim(),
      district: profile.district,
      villageId: profile.villageId,
      location: profile.location,
      ...(profile.locationAccuracyMeters === undefined
        ? {}
        : { locationAccuracyMeters: profile.locationAccuracyMeters }),
      locationSource: profile.locationSource,
      locationValidationStatus: profile.locationValidationStatus,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: existing.exists() },
  );
}
