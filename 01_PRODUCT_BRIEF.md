# 01 — Product Brief MVP AI Jemput Sampah Pinrang

## 1. Nama Produk

Nama kerja:

**SampahTa’ Pinrang**

Alternatif nama:

- AI Jemput Sampah Pinrang
- Jemput Sampah Pinrang
- SampahTa’
- Pinrang Bersih

## 2. Visi Produk

Membangun layanan jemput sampah yang mudah digunakan masyarakat, terutama rumah tangga, toko, sekolah, UMKM, kantor, dan komunitas di wilayah Watang Sawitto dan Paleteang.

Aplikasi harus memudahkan pengguna. Pengguna tidak perlu memahami jenis sampah teknis, tidak perlu mengisi form panjang, dan tidak perlu tahu estimasi kilogram.

Pengguna cukup mengirim WhatsApp, foto sampah, dan lokasi. Sistem cerdas berbasis AI membantu membaca pesan, menganalisa foto, memperkirakan volume, dan membuat tiket penjemputan.

## 3. Masalah yang Diselesaikan

Masalah utama:

1. Warga ingin sampahnya dijemput tetapi tidak ingin repot dengan aplikasi rumit.
2. Operator membutuhkan data yang rapi untuk mengatur jadwal dan armada.
3. Petugas perlu daftar jemput yang jelas dan mudah diikuti.
4. Layanan tahap awal belum siap menggunakan sistem timbang per kilogram.
5. Wilayah pilot hanya dua kecamatan, sehingga sistem harus sederhana dan terkendali.

## 4. Solusi Produk

Sistem MVP terdiri dari:

1. WhatsApp sebagai pintu utama pengguna.
2. Gemini 2.5 Flash untuk memahami pesan dan foto.
3. Dashboard operator untuk verifikasi, jadwal, dan penugasan.
4. PWA petugas untuk daftar pickup dan bukti penjemputan.
5. Laporan operasional sederhana.

## 5. Wilayah Pilot

MVP hanya melayani:

1. Watang Sawitto
2. Paleteang

Jika pengguna berada di luar dua kecamatan ini, sistem tidak membuat tiket aktif. Sistem hanya memberi balasan bahwa layanan masih tahap pilot dan lokasi bisa dicatat sebagai daftar tunggu.

## 6. Model Layanan MVP

### 6.1 Penjemputan Reguler Rumah Tangga

Kode sistem:

`REGULAR_HOUSEHOLD_PICKUP`

Cocok untuk:

- Sampah harian rumah tangga.
- Volume kecil hingga sedang.
- Jemput mingguan atau sesuai jadwal zona.
- 1–3 kantong sampah atau volume rutin rumah tangga.

### 6.2 Angkut 1 Kali Jalan Motor Sampah 3 Roda

Kode sistem:

`ONE_TRIP_TRICYCLE`

Cocok untuk:

- Sampah menumpuk.
- Sampah hasil bersih-bersih.
- Sampah toko/UMKM/kantor/sekolah.
- Kardus, plastik, sampah kebun ringan, sampah rumah tangga campur.
- Estimasi cukup untuk 1 kali jalan motor sampah 3 roda.

### 6.3 Extra Trip

Jika sampah melebihi kapasitas 1 kali jalan, status tiket bisa menjadi:

`EXTRA_TRIP_REQUIRED`

Extra trip bukan paket utama MVP, tetapi kondisi operasional saat volume aktual lebih besar dari estimasi AI/foto.

## 7. Batasan MVP

### Dibangun Sekarang

- WhatsApp intake.
- Analisa teks dan foto dengan AI.
- Estimasi volume visual.
- Tiket pickup otomatis.
- Verifikasi operator.
- Jadwal pickup.
- PWA petugas.
- Bukti foto pickup.
- Laporan operasional.

### Tidak Dibangun Dulu

- Harga per kilogram.
- Saldo tabungan sampah.
- Poin/reward.
- Marketplace.
- Integrasi e-wallet.
- IoT timbangan.
- Aplikasi Android/iOS native.
- Multi wilayah seluruh Pinrang.
- Sistem akuntansi.

## 8. Prinsip Produk

1. WhatsApp-first.
2. AI-assisted, bukan AI yang mengambil keputusan final.
3. Operator tetap punya kendali.
4. Petugas harus mudah bekerja di lapangan.
5. Bahasa pengguna harus sederhana dan tidak teknis.
6. Data tetap rapi untuk pengembangan fase berikutnya.

## 9. Alur Sederhana

```text
Pengguna kirim WA + foto + lokasi
        ↓
AI analisa pesan dan foto
        ↓
Sistem buat tiket pickup
        ↓
Operator cek dan jadwalkan
        ↓
Petugas menjemput
        ↓
Petugas upload bukti dan selesaikan tiket
        ↓
Admin melihat laporan
```

## 10. Tujuan MVP Berhasil

MVP dianggap berhasil jika dalam pilot:

- Pengguna bisa membuat permintaan lewat WA.
- AI bisa membantu operator memahami foto dan volume.
- Operator tidak perlu membaca chat panjang satu per satu.
- Petugas punya daftar kerja harian.
- Pickup bisa selesai dengan bukti foto.
- Laporan harian/mingguan bisa dibuat otomatis.
