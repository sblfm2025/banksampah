# 02 — Stabilisasi Build, Routing, dan Environment

Tujuan dokumen ini adalah memastikan aplikasi bisa dibuka, dites, dibuild, dan dideploy tanpa konfigurasi berbahaya.

---

## 1. Command wajib

Developer wajib menjalankan:

```bash
npm install
npm run lint
npm run test
npm run build
npm run check:production
```

Jika project memakai Firebase emulator:

```bash
npm run test:firebase
npm run test:e2e
```

Jika rules/index perlu diuji:

```bash
firebase emulators:start
```

---

## 2. Node dan npm

Tambahkan file `.nvmrc` jika belum ada:

```text
22
```

Tambahkan `engines` pada `package.json` bila belum ada:

```json
{
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  }
}
```

Tujuan: menghindari hasil build berbeda antar laptop developer.

---

## 3. Audit routing

File utama yang harus dicek:

```text
src/app/App.tsx
src/app/auth/RoleGuard.tsx
src/app/auth/AuthProvider.tsx
src/app/admin/*
src/app/driver/*
src/app/public/*
```

Langkah:

1. Buka `src/app/App.tsx`.
2. Catat semua import komponen route.
3. Pastikan semua file yang diimport benar-benar ada.
4. Pastikan named export cocok.
5. Pastikan lazy import punya fallback loading.
6. Pastikan route admin hanya untuk `SUPER_ADMIN` dan `OPERATOR`.
7. Pastikan route driver hanya untuk `DRIVER`.
8. Pastikan route publik tidak meminta login kecuali memang fitur akun warga.

Jika ada route belum siap, jangan hapus route sembarangan. Buat fallback:

```tsx
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Fitur ini sedang disiapkan untuk pilot lapangan.
      </p>
    </main>
  );
}
```

---

## 4. Demo mode wajib eksplisit

Masalah yang harus dihindari:

- production memakai data demo,
- operator mengira data sudah realtime,
- driver menguji pickup dummy tetapi dianggap pickup asli.

Aturan:

```env
VITE_USE_DEMO_DATA=false
```

Wajib untuk staging/production.

Tambahkan guard pada startup:

```ts
const isProductionLike = import.meta.env.PROD || import.meta.env.VITE_APP_ENV === 'production';
const useDemoData = import.meta.env.VITE_USE_DEMO_DATA !== 'false';

if (isProductionLike && useDemoData) {
  throw new Error('Production tidak boleh berjalan dengan VITE_USE_DEMO_DATA aktif. Set VITE_USE_DEMO_DATA=false.');
}
```

Tambahkan banner jika demo mode aktif:

```tsx
{useDemoData && (
  <div className="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white">
    MODE DEMO AKTIF — DATA BUKAN OPERASIONAL
  </div>
)}
```

---

## 5. Environment variable minimal

Rapikan `.env.example` agar jelas memisahkan frontend dan backend.

### Frontend Vite

```env
VITE_APP_ENV=development
VITE_USE_DEMO_DATA=true
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Backend / Cloud Functions

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
INTERNAL_API_SECRET=
META_APP_SECRET=
```

Catatan:

- `GEMINI_API_KEY` tidak boleh diawali `VITE_`.
- `WHATSAPP_ACCESS_TOKEN` tidak boleh diawali `VITE_`.
- Secret tidak boleh masuk frontend bundle.

---

## 6. Production readiness script

Pastikan script `npm run check:production` memeriksa minimal:

- [ ] `VITE_USE_DEMO_DATA=false`.
- [ ] Project Firebase benar.
- [ ] Firebase Auth aktif.
- [ ] Minimal ada satu `SUPER_ADMIN` aktif.
- [ ] Minimal ada satu `OPERATOR` aktif.
- [ ] Minimal ada satu `DRIVER` aktif untuk pilot.
- [ ] Firestore rules dan indexes sudah deploy.
- [ ] Storage rules sesuai strategi media.
- [ ] Tidak ada secret yang tercetak ke console.

Jika belum lengkap, script harus gagal dengan pesan yang mudah dimengerti.

---

## 7. Struktur error handling UI

Semua halaman utama harus punya state:

- loading,
- empty,
- error,
- success.

Jangan biarkan halaman blank.

Contoh pola:

```tsx
if (isLoading) return <LoadingState label="Memuat data..." />;
if (error) return <ErrorState message="Data gagal dimuat. Coba muat ulang." />;
if (!data?.length) return <EmptyState message="Belum ada data." />;
```

---

## 8. Acceptance criteria stabilisasi

Stabilisasi dianggap selesai jika:

- [ ] Semua command wajib berhasil.
- [ ] Tidak ada route crash.
- [ ] Demo mode tidak bisa aktif di production.
- [ ] Role guard berjalan.
- [ ] Build production tidak punya warning fatal.
- [ ] Tidak ada API key rahasia di frontend bundle.
- [ ] Developer bisa menjalankan project dari README tanpa bertanya ulang.
