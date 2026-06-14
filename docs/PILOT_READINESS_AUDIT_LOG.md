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
- `npm run test`: PASS, 33 file dan 90 test setelah implementasi V4.
- `npm run build`: PASS.
- `npm run test:firebase`: PASS.
- `npm run test:e2e`: PASS.
- `npm run check:production`: FAIL secara benar karena UID Operator/Driver dan
  credential Admin belum tersedia; Auth export produksi sudah berhasil
  memverifikasi 1 akun Super Admin.

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
8. Mempertahankan `storage.rules` deny-all untuk dipakai bila Firebase Storage kelak diaktifkan.
9. Menambahkan UX V4: `/app`, `/auth`, wizard tamu enam langkah, cek status,
   dashboard warga, animasi ringan, dan lazy route admin/driver.
10. Mengubah Firebase script ke `npx firebase-tools` agar tidak bergantung CLI
    global, serta menambah `--write-pilot-uid=true` pada bootstrap akun.

## Blocker Eksternal Sebelum Pilot

Isi `.env.local` tanpa memasukkannya ke Git:

```env
VITE_APP_ENV=production
PILOT_SUPER_ADMIN_UID=
PILOT_OPERATOR_UID=
PILOT_DRIVER_UID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
# atau GOOGLE_APPLICATION_CREDENTIALS=<path-service-account-di-luar-repo>
```

Setelah itu:

1. Super Admin tersedia; buat akun Operator dan Driver terpisah di Firebase Authentication.
2. Pastikan dokumen `users/{uid}` memiliki role yang tepat dan `isActive: true`.
3. Jalankan `npm run check:production` sampai seluruh baris `OK`.
4. Deploy rules, indexes, Storage rules, dan Hosting.
5. Jalankan checklist pilot lapangan.

Status saat audit ditutup: **kode lolos pengujian, Super Admin tersedia, dan
Auth export valid; akun Operator, Driver, serta credential Admin untuk
verifikasi profil produksi belum siap pilot**.

## Deployment 14 Juni 2026

- Hosting: PASS, `https://peduli-pinrang.web.app`.
- Firestore rules: PASS.
- Firestore indexes: PASS, index baru sedang diproses oleh Firebase setelah deploy.
- Firebase Storage: tidak diprovision pada project Spark; deploy rules mengembalikan `defaultBucket 404`.
- Strategi media aktif tetap `VITE_PROOF_MEDIA_PROVIDER=firestore`, sehingga aplikasi tidak bergantung pada Storage.
