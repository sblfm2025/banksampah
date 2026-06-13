# Tahap 5 - PWA Petugas

Tahap ini mengimplementasikan alur lapangan untuk role `DRIVER` berdasarkan
`07_DRIVER_PWA_SPEC.md`.

## Cakupan Selesai

- Route mobile-first `/driver/pickups` dan `/driver/pickups/:id`.
- Redirect root dan role guard untuk memisahkan operator dari driver.
- Daftar pickup aktif milik driver untuk tanggal operasional hari ini.
- Detail customer, alamat, foto awal, estimasi, jadwal, dan catatan operator.
- Tautan langsung ke Google Maps dan WhatsApp customer.
- Aksi mulai pickup dengan status `IN_PROGRESS` dan timestamp.
- Upload bukti sebelum/setelah melalui fallback Firestore untuk paket Spark.
- Hasil selesai, sebagian, extra trip, customer tidak ada, dan batal di lokasi.
- Validasi minimal satu bukti foto dan catatan untuk hasil non-selesai.
- Cache daftar/detail pickup menggunakan IndexedDB.
- Antrean completion offline beserta retry otomatis ketika perangkat online.
- Manifest, service worker, dan application shell precache melalui Vite PWA.

## Backend dan Keamanan

`DriverPickupService` memeriksa `assignedDriverId` pada setiap baca dan mutasi.
Perubahan status, bukti pickup, dan audit log ditulis dalam batch atomik
Firestore. Foto dikompresi menjadi JPEG maksimal sekitar 300 KB dan disimpan
privat di `pickupProofMedia`; `pickupProofs` menyimpan referensinya.

```text
firestore://pickupProofMedia/{mediaId}
```

Handler API menggunakan identitas sesi server; parameter driver dari browser
tidak digunakan untuk menentukan otorisasi.

## Mode Lokal

Gunakan nilai berikut untuk membuka persona driver dengan data demo:

```env
VITE_USE_DEMO_DATA=true
VITE_DEMO_ROLE=DRIVER
```

Jalankan:

```bash
npm run dev
```

## Verifikasi

- `npm run lint`
- `npm test`
- `npm run test:firebase`
- `npm run build`

Firebase client, HTTPS, Firestore, rules, indexes, dan Hosting sudah aktif.
Aktivasi mode produksi tinggal memerlukan akun Auth beserta profil
`users/{uid}` untuk Super Admin dan driver.
