# Checklist Pilot Lapangan

Gunakan checklist ini secara berurutan. Jangan membuka layanan umum sebelum tahap staging dan simulasi internal selesai.

## 1. Konfigurasi Staging/Production

- [ ] `VITE_APP_ENV` bernilai `staging` atau `production`.
- [ ] `VITE_USE_DEMO_DATA=false`.
- [ ] Project Firebase adalah `peduli-pinrang`.
- [ ] Provider data dan media adalah `firestore`.
- [ ] Email/Password Authentication aktif.
- [ ] Satu Super Admin aktif dan UID tercatat.
- [ ] Minimal satu Operator aktif dan UID tercatat.
- [ ] Minimal dua Driver aktif; satu UID driver utama tercatat untuk readiness check.
- [ ] Dokumen `users/{uid}` mempunyai role benar dan `isActive: true`.
- [ ] `npm run check:production` menghasilkan seluruh baris `OK`.
- [ ] Secret backend tidak memakai prefix `VITE_` dan tidak masuk log atau Git.

## 2. Quality Gate

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run test:firebase`
- [ ] `npm run test:e2e`
- [ ] Tidak ada proses emulator tertinggal pada port 8080.

## 3. Deployment

- [ ] Deploy ke staging lebih dahulu.
- [ ] Firestore rules terdeploy.
- [ ] Firestore indexes selesai dibangun.
- [ ] Storage rules deny-all terdeploy.
- [ ] Hosting terdeploy dan route SPA dapat direfresh langsung.
- [ ] Service worker tidak menyajikan build lama.
- [ ] Rollback Hosting sudah dicatat sebelum pilot.

Perintah production setelah staging lolos:

```bash
npm run deploy:production
```

## 4. Hak Akses

- [ ] Anonymous hanya dapat membuka halaman publik/login.
- [ ] Driver ditolak saat membuka `/admin`.
- [ ] Operator ditolak saat membuka `/driver`.
- [ ] Driver hanya melihat tiket miliknya.
- [ ] Driver tidak dapat membaca `whatsappMessages`.
- [ ] User login umum tidak dapat membaca Firebase Storage atau bukti foto tiket lain.
- [ ] Perubahan operator dan driver selalu menghasilkan audit log.
- [ ] Logout menutup akses route privat.

## 5. Simulasi WhatsApp dan AI

- [ ] Teks tanpa foto meminta foto dan menjadi `NEEDS_INFO`.
- [ ] Foto tanpa alamat meminta alamat/lokasi dan menjadi `NEEDS_INFO`.
- [ ] Data lengkap Watang Sawitto membuat tiket dengan nama resmi.
- [ ] Data lengkap Paleteang membuat tiket dengan kelurahan yang tepat.
- [ ] Lokasi di luar layanan tidak membuat tiket aktif.
- [ ] Pertanyaan harga tidak dijawab sebagai harga final atau harga per kg.
- [ ] Voice note tidak membuat pipeline crash.
- [ ] Potensi B3 menjadi `NEEDS_OPERATOR_REVIEW` dan tidak menjanjikan pickup reguler.

## 6. Workflow Operator

- [ ] Tiket baru tampil di dashboard dan daftar.
- [ ] Filter status, kecamatan, kelurahan, tanggal, driver, dan layanan bekerja.
- [ ] Kombinasi filter yang membutuhkan index menampilkan error yang dapat dipahami.
- [ ] Detail menampilkan foto, ringkasan AI, alamat, dan titik peta.
- [ ] Tolak/batalkan mewajibkan alasan dan konfirmasi.
- [ ] Jadwalkan dan assign driver tercatat di audit log.
- [ ] Extra trip dan hasil lapangan bermasalah masuk antrean tindak lanjut.
- [ ] CSV standar tidak memuat nomor WhatsApp penuh.

## 7. Workflow Driver

- [ ] Daftar hari ini dapat dibuka online dan dari cache offline.
- [ ] Buka Maps dan Chat WA menuju tujuan yang benar.
- [ ] Mulai pickup mengubah status menjadi `IN_PROGRESS`.
- [ ] Penyelesaian tanpa foto ditolak.
- [ ] Foto dikompresi dan ukuran media sesuai batas Firestore.
- [ ] `COMPLETED_ONE_TRIP` menjadi `COMPLETED`.
- [ ] `EXTRA_TRIP_REQUIRED` menjadi `EXTRA_TRIP_REQUIRED`.
- [ ] Lokasi tidak ditemukan, akses terhalang, sampah belum siap, dan B3 menjadi `NEEDS_OPERATOR_REVIEW`.
- [ ] Hasil selain selesai satu trip mewajibkan catatan.
- [ ] Kegagalan koneksi masuk antrean retry dan terlihat sebagai pending.

## 8. Pilot Satu Kelurahan

- [ ] Tentukan satu kelurahan, tanggal, jam layanan, operator, dan dua driver.
- [ ] Batasi peserta awal 5-10 warga internal.
- [ ] Siapkan SOP extra trip, B3, batal, jadwal ulang, dan insiden privasi.
- [ ] Catat waktu masuk, waktu verifikasi, waktu assign, waktu pickup, dan hasil akhir.
- [ ] Evaluasi tiket gagal, alamat salah, titik GPS, foto, antrean offline, dan respons WhatsApp setiap hari.
- [ ] Perluasan wilayah hanya dilakukan setelah tidak ada blocker keamanan/operasional.
