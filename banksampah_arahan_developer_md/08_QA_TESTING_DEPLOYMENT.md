# 08 — QA, Testing, Deployment, dan Pilot Lapangan

Dokumen ini berisi checklist pengujian teknis dan uji lapangan sebelum aplikasi dibuka ke masyarakat umum.

---

## 1. Jangan langsung rilis publik

Aplikasi harus melewati tahap:

1. Build lokal.
2. Unit test.
3. Firebase rules test.
4. End-to-end test internal.
5. Staging test dengan akun nyata.
6. Simulasi operator + driver.
7. Pilot kecil satu kelurahan.
8. Evaluasi.
9. Baru perluasan wilayah.

---

## 2. Command wajib sebelum pull request

```bash
npm run lint
npm run test
npm run build
npm run check:production
```

Jika Firebase emulator tersedia:

```bash
npm run test:firebase
npm run test:e2e
```

PR tidak boleh merge jika build/test gagal.

---

## 3. Test role akses

Akun uji:

| Role | Akses yang harus bisa | Akses yang harus ditolak |
|---|---|---|
| SUPER_ADMIN | semua admin | data rahasia backend/secret |
| OPERATOR | dashboard/tiket/jadwal/laporan | manajemen super admin jika dibatasi |
| DRIVER | `/driver/*` tiket sendiri | `/admin/*`, tiket driver lain |
| CUSTOMER | public page jika ada | admin/driver/raw data |
| anonymous | public landing/login | admin/driver/tiket privat |

Test manual:

- [ ] Login admin.
- [ ] Login operator.
- [ ] Login driver.
- [ ] Driver buka URL `/admin` langsung.
- [ ] Operator buka tiket driver lain.
- [ ] User logout lalu akses protected route.

---

## 4. Test WhatsApp/AI

### Skenario 1 — Teks tanpa foto

Input:

```text
mau jemput sampah di Paleteang
```

Expected:

- AI memahami pickup request.
- Sistem minta foto.
- Status `NEEDS_INFO`.
- Tidak ada estimasi volume final.

### Skenario 2 — Foto tanpa alamat

Input:

```text
ini sampah saya
```

+ foto.

Expected:

- AI membaca foto.
- Sistem minta alamat/share location.
- Status `NEEDS_INFO`.

### Skenario 3 — Data lengkap Watang Sawitto

Input:

```text
Saya di Watang Sawitto, sampah kardus cukup banyak, ini fotonya.
```

+ foto + lokasi.

Expected:

- Ticket code dibuat.
- District resmi `Watang Sawitto`.
- Tidak ada penulisan `Sawito` di UI/laporan.
- Status `NEW` atau `NEEDS_OPERATOR_REVIEW`.

### Skenario 4 — Luar wilayah

Input:

```text
Saya di Suppa, bisa jemput sampah?
```

Expected:

- Tidak membuat tiket aktif.
- Bisa simpan waitlist.
- Balasan menjelaskan layanan baru Watang Sawitto dan Paleteang.

### Skenario 5 — Tanya harga

Input:

```text
Berapa harga sampah kardus saya?
```

Expected:

- Tidak menjawab harga final.
- Tidak menyebut kg.
- Balasan aman: nilai/harga dicek operator atau belum tersedia pada MVP.

### Skenario 6 — Voice note

Input:

- audio/voice note.

Expected:

- Sistem tidak crash.
- Balasan minta ketik alamat/foto.

### Skenario 7 — Foto potensi B3

Expected:

- Safety flag aktif.
- Status `NEEDS_OPERATOR_REVIEW`.
- Tidak menjanjikan pickup reguler.

---

## 5. Test operator

- [ ] Tiket baru tampil di dashboard.
- [ ] Filter status berjalan.
- [ ] Filter kecamatan berjalan.
- [ ] Filter kelurahan berjalan.
- [ ] Search ticket code berjalan.
- [ ] Detail tiket menampilkan foto.
- [ ] Detail tiket menampilkan AI summary.
- [ ] Detail tiket menampilkan lokasi.
- [ ] Operator bisa minta data tambahan.
- [ ] Operator bisa konfirmasi.
- [ ] Operator bisa tolak dengan alasan wajib.
- [ ] Operator bisa jadwalkan.
- [ ] Operator bisa assign driver.
- [ ] Audit log tercatat.
- [ ] Extra trip muncul di antrean tindak lanjut.

---

## 6. Test driver

- [ ] Driver melihat pickup hari ini.
- [ ] Driver hanya melihat pickup miliknya.
- [ ] Driver bisa buka maps.
- [ ] Driver bisa chat warga.
- [ ] Driver bisa mulai penjemputan.
- [ ] Status berubah `IN_PROGRESS`.
- [ ] Driver upload foto before/after.
- [ ] Driver selesai 1 trip.
- [ ] Status berubah `COMPLETED`.
- [ ] Driver pilih extra trip.
- [ ] Status berubah `EXTRA_TRIP_REQUIRED`.
- [ ] Driver pilih warga tidak ada.
- [ ] Reason code tersimpan.
- [ ] Upload offline masuk antrean retry.

---

## 7. Test laporan

Filter rentang 1 hari, 7 hari, dan 31 hari.

Expected:

- total tiket masuk benar,
- selesai benar,
- batal benar,
- extra trip benar,
- breakdown kecamatan benar,
- breakdown kelurahan benar,
- breakdown driver benar,
- CSV tidak memuat nomor WA penuh pada export standar,
- timezone memakai `Asia/Makassar`.

---

## 8. Test keamanan rules

Gunakan emulator.

Test minimal:

- [ ] Anonymous tidak bisa baca `pickupRequests`.
- [ ] Driver A tidak bisa baca tiket Driver B.
- [ ] Driver tidak bisa baca `whatsappMessages`.
- [ ] Driver tidak bisa update tiket tanpa assigned.
- [ ] Operator tidak bisa update status tanpa audit log.
- [ ] User login umum tidak bisa baca semua foto bukti.
- [ ] Delete data operasional ditolak.
- [ ] Raw payload hanya bisa dibaca back office/admin sesuai kebijakan.

---

## 9. Checklist deployment staging

Sebelum staging:

- [ ] Branch sudah merge dari main terbaru.
- [ ] `.env.staging` lengkap.
- [ ] Demo mode false.
- [ ] Firebase project benar.
- [ ] Auth Email/Password aktif.
- [ ] Akun super admin dibuat.
- [ ] Akun operator dibuat.
- [ ] Akun driver dibuat.
- [ ] Rules/index deploy.
- [ ] Hosting deploy.
- [ ] Webhook backend publik aktif jika WhatsApp diuji.
- [ ] Secret tidak tampil di log.

Deploy:

```bash
npm run build
firebase deploy --only hosting,firestore:rules,firestore:indexes --project staging
```

Jika production:

```bash
npm run deploy:production
```

Pastikan project alias `production` benar sebelum menjalankan.

---

## 10. Pilot lapangan minimal

Hari 1 — Simulasi internal:

- 10 tiket dummy,
- 2 driver,
- 1 operator,
- tanpa warga umum.

Hari 2 — Simulasi WhatsApp internal:

- 5 nomor internal,
- foto sampah asli/simulasi,
- alamat lengkap,
- uji batal/ubah jadwal.

Hari 3 — Pilot terbatas:

- 1 kelurahan,
- 10–20 warga/UMKM,
- jam layanan terbatas,
- operator mencatat kendala.

Data yang wajib dicatat:

- jumlah pesan masuk,
- jumlah tiket valid,
- jumlah butuh data,
- jumlah pickup selesai,
- jumlah gagal,
- alasan gagal,
- waktu rata-rata dari tiket masuk ke jadwal,
- waktu rata-rata dari assign ke selesai,
- keluhan warga,
- kendala driver.

---

## 11. Go/no-go rilis lebih luas

Boleh perluas pilot jika:

- [ ] Completion rate minimal 80% pada pilot kecil.
- [ ] Tidak ada kebocoran data/foto.
- [ ] Driver tidak bingung memakai PWA.
- [ ] Operator tidak kewalahan.
- [ ] Tiket ganda terkendali.
- [ ] Luar wilayah tidak menjadi tiket aktif.
- [ ] Warga mendapat balasan jelas.

Tunda rilis jika:

- [ ] Banyak route crash.
- [ ] Build/test gagal.
- [ ] Demo mode masih aktif production.
- [ ] Foto bukti bisa dibaca semua user login.
- [ ] Driver bisa melihat tiket orang lain.
- [ ] AI menjawab harga/kg/jadwal final.
- [ ] Laporan tidak akurat.
