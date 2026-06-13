# Tahap 4 - Dashboard Operator

Status workflow inti: selesai pada 13 Juni 2026.

## Fitur Selesai

- Firebase Auth state observer.
- Role guard untuk `SUPER_ADMIN` dan `OPERATOR`.
- Dashboard ringkasan operasional.
- Daftar tiket dengan pencarian dan filter.
- Detail tiket dan customer.
- Hasil analisis AI, confidence, dan safety flags.
- Link WhatsApp customer dan Google Maps.
- Konfirmasi dan penolakan tiket.
- Penjadwalan pickup.
- Assign petugas.
- Audit log pada seluruh perubahan backend.
- API handler framework-agnostic.

## Mode Data

### Demo

Default lokal:

```env
VITE_USE_DEMO_DATA=true
```

Mode ini memakai data in-memory dan menampilkan banner kuning. Perubahan hilang
saat halaman dimuat ulang.

### Produksi

```env
VITE_USE_DEMO_DATA=false
VITE_DATA_PROVIDER=firestore
VITE_PROOF_MEDIA_PROVIDER=firestore
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_APP_ID=
```

Pada paket Spark, repository produksi memakai Firestore Web SDK secara
langsung. Security Rules memvalidasi role, transisi status, field yang berubah,
dan audit log atomik. Repository API berikut tetap tersedia bila backend
rahasia telah dideploy:

- `GET /api/reports/summary`
- `GET /api/pickup-requests`
- `GET /api/pickup-requests/:id`
- `PATCH /api/pickup-requests/:id/status`
- `PATCH /api/pickup-requests/:id/schedule`
- `PATCH /api/pickup-requests/:id/assign-driver`
- `GET /api/drivers?active=true`

## Aturan Workflow

```text
NEEDS_OPERATOR_REVIEW
  -> CONFIRMED
  -> SCHEDULED
  -> ASSIGNED
```

- Penolakan wajib memiliki alasan.
- Tiket harus dikonfirmasi sebelum dijadwalkan.
- Tiket harus dijadwalkan sebelum driver ditugaskan.
- Semua aksi penting meminta konfirmasi UI.
- Backend tetap menjadi sumber validasi final.

## Fitur Lanjutan yang Sudah Ditambahkan

- List jadwal harian lintas tiket dan pengelompokan per petugas.
- Pengelolaan profil dan aktivasi petugas oleh Super Admin.
- Laporan periode dan export CSV tanpa data pribadi customer.
- Login Email/Password, logout, dan penanganan profil role yang belum dibuat.
- Preview media bukti privat dari Firestore.
- Audit log atomik untuk status, jadwal, penugasan, mulai, dan hasil pickup.

## Verifikasi

```text
Lint: lulus
Unit/UI tests: 59 test
Firebase integration/rules: 29 test
Production build dan deployment Hosting: lulus
```

Transaction ticket counter menggunakan retry maksimum 10 kali untuk menghadapi
contention pada nomor urut harian.
