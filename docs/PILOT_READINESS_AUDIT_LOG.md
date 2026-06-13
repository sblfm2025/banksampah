# Pilot Readiness Audit Log

Tanggal: 14 Juni 2026 (Asia/Makassar)
Branch: `fix/pilot-readiness-banksampah`
Commit awal audit: `411406f`
Node version: `v24.16.0` (minimum project Node 22)
NPM version: `11.13.0`
Firebase CLI: `15.18.0`

## Hasil Baseline

- `npm install`: PASS, terdapat 6 advisory moderate yang perlu dipantau tanpa `--force`.
- `npm run lint`: PASS.
- `npm run test`: PASS, 28 file dan 73 test sebelum hardening.
- `npm run build`: PASS.
- `npm run check:production`: sebelumnya PASS palsu karena hanya mendeteksi satu akun Auth.
- `npm run test:firebase`: awalnya terhalang proses emulator pada port 8080.
- `npm run test:e2e`: awalnya FAIL karena fixture laporan bergantung tanggal eksekusi.

## Hasil Setelah Hardening

- `npm run lint`: PASS.
- `npm run test`: PASS, 28 file dan 77 test.
- `npm run build`: PASS.
- `npm run test:firebase`: PASS.
- `npm run test:e2e`: PASS.
- `npm run check:production`: FAIL secara benar karena konfigurasi akun peran pilot dan service account belum lengkap.

## Risiko yang Ditemukan

1. Storage bukti pickup dapat dibaca semua pengguna yang login.
2. Mode demo tidak mempunyai guard startup untuk build production/staging.
3. Readiness check tidak membuktikan adanya akun aktif `SUPER_ADMIN`, `OPERATOR`, dan `DRIVER`.
4. Filter tiket Firestore hanya mengirim satu filter ke server dan menyaring sisanya dari maksimal 100 dokumen.
5. Reason code lapangan belum mencakup lokasi tidak ditemukan, akses terhalang, sampah belum siap, dan limbah berbahaya.
6. Test laporan menggunakan waktu saat test berjalan sehingga berubah hasil antar tanggal.

## Perbaikan yang Dilakukan

1. Menutup seluruh akses Firebase Storage untuk bukti pickup karena media produksi memakai Firestore privat.
2. Menambahkan `.nvmrc`, `engines`, `VITE_APP_ENV`, startup guard, dan banner demo merah.
3. Memperketat readiness check untuk tiga UID peran, keberadaan akun Auth, role Firestore, dan `isActive`.
4. Menambahkan filter server-side operator, filter tanggal/driver/layanan, serta composite indexes umum.
5. Menambahkan reason code lapangan dan mapping kasus bermasalah ke `NEEDS_OPERATOR_REVIEW`.
6. Memperketat Firestore rules untuk foto, reason code, catatan lapangan, transisi status, dan audit.
7. Menstabilkan fixture tanggal laporan dan alur E2E.
8. Menyertakan `storage.rules` pada deployment production.

## Blocker Eksternal Sebelum Pilot

Isi `.env.local` tanpa memasukkannya ke Git:

```env
VITE_APP_ENV=production
PILOT_SUPER_ADMIN_UID=
PILOT_OPERATOR_UID=
PILOT_DRIVER_UID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Setelah itu:

1. Super Admin tersedia; buat akun Operator dan Driver terpisah di Firebase Authentication.
2. Pastikan dokumen `users/{uid}` memiliki role yang tepat dan `isActive: true`.
3. Jalankan `npm run check:production` sampai seluruh baris `OK`.
4. Deploy rules, indexes, Storage rules, dan Hosting.
5. Jalankan checklist pilot lapangan.

Status saat audit ditutup: **kode lolos pengujian dan Super Admin tersedia; akun Operator, Driver, serta verifikasi profil produksi belum siap pilot**.
