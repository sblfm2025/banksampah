# 01 — Prioritas Eksekusi Developer

Dokumen ini menyusun prioritas kerja teknis agar aplikasi siap diuji lapangan. Fokusnya adalah menyelesaikan masalah yang paling berisiko terhadap operasional, bukan menambah fitur besar.

---

## Prioritas 0 — Verifikasi kondisi repo saat ini

Jalankan dari root project:

```bash
npm install
npm run lint
npm run test
npm run build
npm run check:production
```

Jika salah satu gagal, jangan lanjut fitur baru. Perbaiki dulu sampai semua command inti hijau.

Catat hasil awal di file baru:

```text
docs/PILOT_READINESS_AUDIT_LOG.md
```

Format catatan:

```md
# Pilot Readiness Audit Log

Tanggal:
Branch:
Commit:
Node version:
NPM version:

## Hasil Command
- npm install: PASS/FAIL
- npm run lint: PASS/FAIL
- npm run test: PASS/FAIL
- npm run build: PASS/FAIL
- npm run check:production: PASS/FAIL

## Error Utama
1.
2.
3.

## Perbaikan yang Dilakukan
1.
2.
3.
```

---

## Prioritas 1 — Stabilitas build, routing, dan env

Target:

- Aplikasi bisa dibuka di mode development.
- Route publik, admin, dan driver tidak crash.
- Build production berhasil.
- Mode demo tidak aktif secara tidak sengaja.

Checklist:

- [ ] Verifikasi seluruh import di `src/app/App.tsx` benar-benar punya file tujuan.
- [ ] Verifikasi route publik:
  - `/`
  - `/sampahku`
  - `/tickets`
  - `/tickets/:id`
  - `/profile`
  - `/pickup/new`
- [ ] Verifikasi route admin:
  - `/admin`
  - `/admin/tickets`
  - `/admin/tickets/:id`
  - `/admin/schedules`
  - `/admin/map`
  - `/admin/drivers`
  - `/admin/regions`
  - `/admin/reports`
- [ ] Verifikasi route driver:
  - `/driver`
  - `/driver/pickups`
  - `/driver/pickups/:id`
- [ ] Jika ada route belum siap, jangan biarkan crash. Tampilkan halaman `ComingSoonPage` atau sembunyikan menu.
- [ ] Pastikan semua protected route memakai `RoleGuard`.
- [ ] Pastikan tidak ada import mati/komponen kosong yang membuat build gagal.

---

## Prioritas 2 — Hak akses dan keamanan data warga

Target:

- Data warga, nomor WhatsApp, lokasi, foto, dan raw payload tidak bocor.
- Driver hanya melihat tiket yang ditugaskan kepadanya.
- Operator tidak bisa mengubah status tanpa audit log.
- Storage/Firestore media sesuai strategi produksi.

Checklist:

- [ ] Audit `firestore.rules` dengan emulator.
- [ ] Audit `storage.rules`. Jangan izinkan semua user login membaca bukti foto pickup.
- [ ] Jika bukti foto memakai Firestore compressed base64 pada paket Spark, nonaktifkan akses Storage path yang tidak dipakai.
- [ ] Jika bukti foto memakai Storage, wajib pakai metadata `pickupRequestId`, `driverId`, dan rule read terbatas.
- [ ] Pastikan export CSV laporan tidak memuat nomor WhatsApp/nama warga tanpa alasan operasional kuat.

---

## Prioritas 3 — Wilayah layanan dan peta operasional

Target:

- Data wilayah tidak diketik bebas.
- Operator bisa filter per kecamatan dan kelurahan.
- Peta OSM menampilkan titik pickup aktif.
- Penulisan “Watang Sawitto” konsisten.

Checklist:

- [ ] Buat/validasi master kecamatan.
- [ ] Buat/validasi master kelurahan Watang Sawitto dan Paleteang.
- [ ] Tambahkan dukungan `environmentId` / `environmentName` untuk lingkungan/zona secara opsional.
- [ ] Normalisasi alias `Sawito` ke `Sawitto`.
- [ ] Semua laporan/export memakai nama resmi.
- [ ] Peta operator memakai marker berdasarkan status tiket.
- [ ] Data realtime yang dimaksud adalah data operasional aplikasi, bukan lalu lintas peta.

---

## Prioritas 4 — Workflow operator dan driver

Target:

- Operator tidak kewalahan oleh tiket masuk.
- Driver punya tombol lapangan yang jelas.
- Extra trip dan gagal pickup tercatat rapi.

Checklist operator:

- [ ] Tambahkan antrean prioritas:
  - tiket baru,
  - butuh data,
  - perlu review operator,
  - foto buram,
  - lokasi kurang lengkap,
  - safety flag,
  - pickup hari ini,
  - extra trip.
- [ ] Aksi operator wajib konfirmasi:
  - tolak,
  - batalkan,
  - assign driver,
  - ubah jadwal.
- [ ] Penolakan wajib alasan.
- [ ] Jadwal dan assign wajib audit log.

Checklist driver:

- [ ] Tombol besar:
  - Mulai Jemput,
  - Buka Maps,
  - Chat Warga,
  - Upload Foto,
  - Selesai,
  - Butuh Extra Trip,
  - Warga Tidak Ada,
  - Lokasi Tidak Sesuai,
  - Sampah Belum Disiapkan.
- [ ] Driver tidak boleh menyelesaikan tiket tanpa bukti foto.
- [ ] Upload gagal harus masuk antrean retry offline.
- [ ] Status lapangan harus terbaca operator.

---

## Prioritas 5 — Uji pilot terbatas

Jangan langsung buka ke warga umum. Lakukan pilot bertahap:

1. Simulasi internal dengan data dummy.
2. Simulasi operator + driver tanpa WhatsApp live.
3. Uji WhatsApp terbatas dengan 5–10 orang internal.
4. Pilot satu kelurahan.
5. Evaluasi harian.
6. Baru perluas ke kelurahan lain.

Minimal sebelum pilot warga:

- [ ] Ada 1 Super Admin.
- [ ] Ada minimal 1 Operator.
- [ ] Ada minimal 2 Driver.
- [ ] Ada master wilayah.
- [ ] Ada template balasan WA.
- [ ] Ada SOP jam layanan.
- [ ] Ada SOP extra trip.
- [ ] Ada SOP sampah B3/berbahaya.
- [ ] Ada SOP batal/jadwal ulang.
