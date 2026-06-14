# Aktivasi Firebase Produksi

Firebase Web App sudah diarahkan ke project:

```text
peduli-pinrang
```

Alias Firebase CLI:

```text
production -> peduli-pinrang
```

## Status Saat Ini

Pada 14 Juni 2026:

- Firebase CLI login sebagai `maroamabbarakka@gmail.com`.
- Web App SDK terverifikasi cocok dengan project.
- Firestore `(default)` sudah dibuat di `asia-southeast2` (Jakarta).
- Firestore memakai Standard edition, realtime updates, free tier, dan delete
  protection.
- Firestore rules sudah aktif.
- Delapan composite index dikonfigurasi; indeks ringkasan tiket harian dapat
  berstatus `BUILDING` sesaat setelah deployment.
- Firebase Hosting sudah live di `https://peduli-pinrang.web.app`.
- Firebase Authentication dan provider Email/Password sudah aktif.
- Super Admin pertama sudah dibuat dan UID tercatat. Akun Operator dan Driver
  belum tersedia pada readiness check terakhir.
- HTML route memakai `no-cache`; asset hash memakai immutable cache.
- Firebase Storage tidak dipakai karena default bucket baru memerlukan paket
  Blaze, sedangkan project tetap menggunakan paket Spark/free.
- Bukti driver memakai fallback `pickupProofMedia` di Firestore. Browser
  mengompresi setiap foto menjadi JPEG maksimal sekitar 300 KB sebelum upload.
- Setiap bagian sebelum/setelah dibatasi maksimal dua foto. Solusi ini cocok
  untuk volume pilot, bukan arsip media berskala besar.
- Mode demo sudah dimatikan pada konfigurasi build produksi.

## Akun Deployment

Untuk deployment CI jangka panjang, gunakan service account dengan permission
minimum untuk Hosting, Firestore rules/indexes, dan Storage rules. Jangan
bergantung permanen pada login Firebase CLI personal.

## Layanan yang Harus Diaktifkan

Di Firebase Console project `peduli-pinrang`:

1. Aktifkan Firebase Authentication dan provider login yang dipakai.
2. Pantau pemakaian Firestore. Pindahkan media ke object storage saat volume
   operasional sudah melampaui skala pilot.
3. Buat akun Operator dan Driver menggunakan `npm run bootstrap:user` dari
   `22_AUTH_BOOTSTRAP.md`, atau buat manual di Console.
4. Pastikan dokumen `users/{firebaseAuthUid}` memiliki role dan
   `isActive: true`.

Contoh dokumen operator:

```json
{
  "name": "Operator SampahTa",
  "email": "operator@example.com",
  "role": "OPERATOR",
  "isActive": true
}
```

## Deployment

Untuk deploy ulang:

```bash
npm run test:all
npm run deploy:rules
npm run deploy:hosting
```

`deploy:hosting` dan `deploy:production` menjalankan
`npm run check:production` terlebih dahulu. Jika akun pilot atau credential
Admin belum lengkap, deploy Hosting produksi akan berhenti sebelum build.
`deploy:rules` tetap dapat dijalankan terpisah untuk memperbaiki rules/indexes
keamanan sebelum pilot dibuka.

Atau deploy frontend dan rules sekaligus:

```bash
npm run deploy:production
```

Storage hanya dideploy jika bucket sudah tersedia:

```bash
npm run deploy:storage
```

## Hosting

Konfigurasi Hosting sudah mencakup:

- SPA rewrite ke `index.html`.
- Cache satu tahun untuk asset dengan content hash.
- `no-cache` untuk HTML, manifest, dan service worker.
- Output deployment dari folder `dist`.

## Aktivasi Login Nyata

Langkah bootstrap akun lengkap tersedia pada `22_AUTH_BOOTSTRAP.md`.

Pemeriksaan otomatis:

```bash
npm run check:production
```

Perintah akan gagal sampai UID `SUPER_ADMIN`, `OPERATOR`, dan `DRIVER`
terisi, akun Auth ditemukan, dan profil Firestore aktif sesuai role. Nilai
secret tidak dicetak.

Mode demo sudah dimatikan setelah akun Super Admin dan profil role dibuat:

```env
VITE_USE_DEMO_DATA=false
```

Kemudian build dan deploy ulang.

Frontend produksi menyediakan login Email/Password pada `/auth`, kompatibilitas
route lama `/login`, logout, dan
mengirim Firebase ID token sebagai header `Authorization: Bearer ...` ke API.
Backend deployment wajib memverifikasi token tersebut dengan Firebase Admin
SDK sebelum meneruskan request ke handler operator atau driver.

Workflow dashboard dan driver juga mendukung akses Firestore langsung melalui:

```env
VITE_DATA_PROVIDER=firestore
```

Mode ini tidak memerlukan Cloud Functions. Security rules memvalidasi role,
field yang berubah, transisi status, kepemilikan tugas, dan bukti pickup dalam
atomic batch. Backend tetap diperlukan untuk webhook WhatsApp, Gemini, dan
integrasi rahasia lainnya.

Provider bukti foto untuk paket Spark:

```env
VITE_PROOF_MEDIA_PROVIDER=firestore
```

Nilai alternatif yang didukung adalah `firebase-storage` setelah bucket
tersedia, atau `disabled` untuk mematikan upload.
