# 09 — Testing dan Acceptance Criteria

## 1. Tujuan Pengujian

Pengujian memastikan MVP berjalan sesuai fokus:

- WhatsApp masuk.
- Foto diterima.
- AI menganalisa foto dan teks.
- Tiket pickup dibuat.
- Operator bisa menjadwalkan.
- Petugas bisa menyelesaikan pickup.
- Sistem tidak masuk ke harga per kg.

## 2. Acceptance Criteria Utama

MVP dianggap lolos jika:

1. Pengguna bisa mengirim WhatsApp teks.
2. Pengguna bisa mengirim foto sampah.
3. Sistem bisa menyimpan pesan WhatsApp.
4. Foto tersimpan pada media provider privat yang dikonfigurasi. Pada paket
   Spark, media bukti driver disimpan terkompresi di Firestore.
5. Gemini menganalisa pesan/foto.
6. AI menghasilkan JSON valid pada kasus normal.
7. Sistem bisa membuat tiket otomatis.
8. Operator bisa melihat dan memverifikasi tiket.
9. Operator bisa menjadwalkan tiket.
10. Operator bisa assign petugas.
11. Petugas bisa melihat pickup hari ini.
12. Petugas bisa upload bukti.
13. Petugas bisa menyelesaikan tiket.
14. Laporan harian menampilkan total pickup.
15. Luar wilayah tidak langsung menjadi tiket aktif.
16. Sistem tidak menghitung harga per kg.
17. Sistem tidak menjanjikan harga final.
18. Sistem tidak mengklaim berat kg dari foto.
19. Sistem bisa menandai potensi sampah berbahaya.
20. Semua API key hanya berada di backend/env.

## 3. Test Scenario WhatsApp

### 3.1 Pengguna Kirim Teks Tanpa Foto

Input:

```text
mau jemput sampah di Paleteang
```

Expected:

- AI memahami intent pickup.
- AI meminta foto.
- Status session/ticket `NEEDS_INFO`.
- Tidak ada estimasi volume final.

### 3.2 Pengguna Kirim Foto Tanpa Alamat

Input:

- Foto sampah.
- Teks: `ini sampah saya`

Expected:

- AI menganalisa foto.
- AI meminta alamat atau share location.
- Status `NEEDS_INFO`.

### 3.3 Foto + Alamat Paleteang

Input:

```text
Paleteang dekat masjid, mau angkut sampah ini
```

Plus foto.

Expected:

- Tiket dibuat.
- District `PALETEANG`.
- Volume sesuai hasil AI.
- Status `NEEDS_OPERATOR_REVIEW` atau `NEW`.

### 3.4 Foto + Alamat Watang Sawitto

Input:

```text
Saya di Watang Sawitto dekat lapangan, ada sampah kardus banyak
```

Plus foto.

Expected:

- Tiket dibuat.
- District `WATANG_SAWITTO`.
- Service type kemungkinan `ONE_TRIP_TRICYCLE`.

### 3.5 Pengguna di Luar Wilayah

Input:

```text
Saya di Suppa, bisa jemput?
```

Expected:

- Tidak buat tiket aktif.
- Balas layanan baru Watang Sawitto dan Paleteang.
- Simpan sebagai waitlist/lead opsional.

### 3.6 Foto Volume Besar

Input:

- Foto tumpukan banyak kardus/karung.

Expected:

- Volume `LARGE` atau `OVERSIZED`.
- Rekomendasi `ONE_TRIP_TRICYCLE` atau `NEEDS_OPERATOR_REVIEW`.
- Tidak menyebut kg.
- Tidak menyebut harga pasti.

### 3.7 Foto Limbah Berbahaya

Input:

- Foto limbah medis/jarum/bahan kimia.

Expected:

- Safety flag aktif.
- Status `NEEDS_OPERATOR_REVIEW` atau `REJECTED`.
- Balasan aman dan tidak menjanjikan pickup reguler.

## 4. Test Scenario Dashboard Operator

### 4.1 List Tiket

Expected:

- Tiket baru tampil.
- Filter status berjalan.
- Filter kecamatan berjalan.
- Search nomor WA berjalan.

### 4.2 Detail Tiket

Expected:

- Foto tampil.
- AI summary tampil.
- Chat terkait tampil.
- Lokasi tampil jika ada.

### 4.3 Jadwalkan Tiket

Expected:

- Operator bisa memilih tanggal.
- Operator bisa memilih time window.
- Operator bisa assign driver.
- Status berubah menjadi `SCHEDULED`/`ASSIGNED`.

### 4.4 Tolak Tiket

Expected:

- Operator wajib isi alasan.
- Status menjadi `REJECTED`.
- Audit log tersimpan.

## 5. Test Scenario PWA Petugas

### 5.1 Pickup Hari Ini

Expected:

- Petugas hanya melihat tiket miliknya.
- Tiket sesuai tanggal hari ini.

### 5.2 Mulai Penjemputan

Expected:

- Status menjadi `IN_PROGRESS`.
- Timestamp tersimpan.

### 5.3 Upload Bukti

Expected:

- Foto dikompresi ke JPEG dan tersimpan ke `pickupProofMedia` pada mode Spark.
- URL masuk ke `pickupProofs`.

### 5.4 Selesai 1 Trip

Expected:

- Status menjadi `COMPLETED`.
- actualTripResult `COMPLETED_ONE_TRIP`.
- completedAt terisi.

### 5.5 Extra Trip

Expected:

- Status menjadi `EXTRA_TRIP_REQUIRED`.
- Petugas wajib isi catatan.
- Operator melihat tiket perlu tindak lanjut.

## 6. Test AI Output Validation

AI output harus divalidasi dengan Zod.

Jika JSON valid:

- Simpan ke `aiAnalyses`.
- Pakai hasil untuk tiket.

Jika JSON invalid:

- Simpan raw output.
- Set status `NEEDS_OPERATOR_REVIEW`.
- Kirim balasan aman kepada pengguna.

Balasan aman:

```text
Terima kasih. Permintaan sudah kami terima dan akan dicek operator. Mohon pastikan alamat dan foto sampah sudah dikirim.
```

## 7. Test Keamanan

Pastikan:

1. Endpoint admin tidak bisa diakses tanpa login.
2. Role driver tidak bisa akses admin.
3. API key tidak tampil di frontend.
4. Webhook verify token valid.
5. Upload file dibatasi tipe gambar.
6. Nomor WhatsApp tidak diekspor sembarangan.
7. Raw payload tidak tampil untuk role driver.
