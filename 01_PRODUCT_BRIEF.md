# 01 - Product Brief MVP Hybrid Jemput Sampah Pinrang

## 1. Nama Produk

Nama kerja:

**SampahTa' Pinrang**

Alternatif nama:

- AI Jemput Sampah Pinrang
- Jemput Sampah Pinrang
- Peduli Pinrang Jemput Sampah
- SampahTa'
- Pinrang Bersih

## 2. Visi Produk

Membangun layanan jemput sampah yang mudah digunakan masyarakat, terutama rumah
tangga, toko, sekolah, UMKM, kantor, dan komunitas di wilayah Watang Sawitto dan
Paleteang.

Aplikasi harus memudahkan pengguna dengan dua jalur yang sama-sama sah:

1. **Jalur WhatsApp** untuk warga yang awam aplikasi, tidak terbiasa email, atau
   hanya ingin mengirim pesan, foto sampah, dan lokasi.
2. **Jalur aplikasi web/PWA** untuk warga yang ingin mengisi data lebih lengkap,
   memantau status, dan menyimpan riwayat permintaan.

Kedua jalur tersebut harus menghasilkan data operasional yang sama di sistem,
sehingga operator dan petugas tetap bekerja dari satu dashboard dan satu database.

## 3. Prinsip Identitas Pengguna

Nomor WhatsApp adalah identitas kontak utama warga.

Email tidak wajib untuk warga, kecuali warga memilih masuk menggunakan Google
atau email pribadi. Jika warga tidak memiliki email, operator dapat membantu
membuat akun dengan email dummy/internal yang terhubung ke nomor WhatsApp.

Metode masuk warga yang didukung:

1. Masuk dengan Google.
2. Masuk dengan email dan password.
3. Masuk dengan nomor WhatsApp dan password, menggunakan email dummy/internal di
   belakang layar.

Walaupun email opsional, data berikut tetap wajib untuk layanan jemput:

- Nama lengkap.
- Nomor WhatsApp aktif.
- Kecamatan dan kelurahan.
- Alamat lengkap tambahan.
- Titik lokasi/geolokasi yang dikonfirmasi.

## 4. Masalah yang Diselesaikan

Masalah utama:

1. Warga ingin sampahnya dijemput tetapi tidak ingin repot dengan aplikasi rumit.
2. Sebagian warga tidak memiliki atau tidak terbiasa menggunakan email.
3. Operator membutuhkan data yang rapi untuk mengatur jadwal dan petugas.
4. Petugas perlu daftar jemput yang jelas dan mudah diikuti.
5. Layanan tahap awal belum siap menggunakan sistem timbang per kilogram.
6. Wilayah pilot hanya dua kecamatan, sehingga sistem harus sederhana dan
   terkendali.

## 5. Solusi Produk

Sistem MVP terdiri dari:

1. WhatsApp sebagai pintu layanan utama untuk warga awam.
2. Aplikasi web/PWA sebagai pintu layanan mandiri untuk warga yang lebih siap
   digital.
3. AI Gemini untuk memahami pesan, foto, dan konteks lokasi dari jalur WhatsApp.
4. Dashboard operator untuk verifikasi, koreksi data, jadwal, dan penugasan.
5. PWA petugas untuk daftar pickup, navigasi, kontak warga, dan bukti
   penjemputan.
6. Laporan operasional sederhana.

AI membantu membaca dan merapikan data, tetapi keputusan final tetap berada pada
operator.

## 6. Wilayah Pilot

MVP hanya melayani:

1. Watang Sawitto
2. Paleteang

Jika pengguna berada di luar dua kecamatan ini, sistem tidak membuat permintaan
aktif. Sistem hanya memberi balasan bahwa layanan masih tahap pilot dan lokasi
dapat dicatat sebagai daftar tunggu atau bahan evaluasi perluasan wilayah.

## 7. Model Layanan MVP

### 7.1 Penjemputan Reguler Rumah Tangga

Kode sistem:

`REGULAR_HOUSEHOLD_PICKUP`

Cocok untuk:

- Sampah harian rumah tangga.
- Volume kecil hingga sedang.
- Jemput mingguan atau sesuai jadwal zona.
- 1-3 kantong sampah atau volume rutin rumah tangga.

### 7.2 Angkut 1 Kali Jalan Motor Sampah 3 Roda

Kode sistem:

`ONE_TRIP_TRICYCLE`

Cocok untuk:

- Sampah menumpuk.
- Sampah hasil bersih-bersih.
- Sampah toko/UMKM/kantor/sekolah.
- Kardus, plastik, sampah kebun ringan, sampah rumah tangga campur.
- Estimasi cukup untuk 1 kali jalan motor sampah 3 roda.

### 7.3 Extra Trip

Jika sampah melebihi kapasitas 1 kali jalan, status permintaan bisa menjadi:

`EXTRA_TRIP_REQUIRED`

Extra trip bukan paket utama MVP, tetapi kondisi operasional saat volume aktual
lebih besar dari estimasi AI/foto.

## 8. Alur WhatsApp

```text
Warga kirim WA + foto + lokasi
        |
Sistem/AI membaca pesan, foto, dan lokasi
        |
Jika data kurang, sistem meminta nama atau detail alamat tambahan
        |
Warga mengonfirmasi geolokasi dan alamat
        |
Sistem membuat permintaan jemput
        |
Operator verifikasi dan menjadwalkan
        |
Petugas menjemput dan mengunggah bukti
        |
Admin/operator melihat laporan
```

Pada jalur WhatsApp, sistem minimal harus meminta:

- Nama warga jika belum diketahui.
- Nomor WhatsApp dari pesan masuk.
- Foto sampah.
- Share location/geolokasi.
- Detail alamat tambahan seperti nama jalan, patokan, RT/RW, atau keterangan
  rumah.

## 9. Alur Aplikasi Web/PWA

```text
Warga masuk dengan Google, email, atau nomor WhatsApp
        |
Warga melengkapi profil wajib
        |
Warga memilih lokasi lewat GPS/peta dan menambahkan alamat detail
        |
Warga mengunggah foto sampah
        |
Sistem membuat permintaan jemput
        |
Operator verifikasi dan menjadwalkan
        |
Petugas menjemput dan mengunggah bukti
```

Pada jalur aplikasi, email tidak wajib sebagai data profil warga. Yang wajib
adalah nomor WhatsApp aktif, nama lengkap, alamat, dan titik lokasi.

## 10. Batasan MVP

### Dibangun Sekarang

- WhatsApp intake.
- Aplikasi warga untuk pengajuan mandiri.
- Login Google, email, dan nomor WhatsApp berbasis akun internal.
- Analisa teks dan foto dengan AI.
- Estimasi volume visual.
- Permintaan pickup otomatis.
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

## 11. Prinsip Produk

1. Hybrid intake: WhatsApp untuk kemudahan, aplikasi untuk kerapian data.
2. WhatsApp number first: nomor WA adalah kontak wajib warga.
3. Email optional: email hanya wajib bila warga memilih Google/email pribadi.
4. AI-assisted: AI membantu membaca pesan dan foto, bukan mengambil keputusan
   final.
5. Operator tetap punya kendali.
6. Petugas harus mudah bekerja di lapangan.
7. Bahasa pengguna harus sederhana dan tidak teknis.
8. Semua jalur masuk harus berakhir pada database permintaan yang sama.

## 12. Tujuan MVP Berhasil

MVP dianggap berhasil jika dalam pilot:

- Warga gaptek bisa membuat permintaan cukup lewat WhatsApp.
- Warga yang lebih siap digital bisa membuat dan memantau permintaan lewat
  aplikasi.
- Nomor WhatsApp menjadi kontak utama untuk semua warga.
- AI membantu operator memahami pesan, foto, lokasi, dan volume.
- Operator tidak perlu membaca chat panjang satu per satu.
- Petugas punya daftar kerja harian.
- Pickup bisa selesai dengan bukti foto.
- Laporan harian/mingguan bisa dibuat otomatis.
