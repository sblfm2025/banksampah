# 08 — UI/UX Guidelines

## 1. Prinsip Utama UX

Aplikasi ini harus memudahkan pengguna dan operator.

Prinsip utama:

> Yang pintar adalah sistemnya, bukan pengguna yang dipaksa pintar.

Pengguna umum tidak perlu melihat istilah teknis seperti PET, HDPE, residu, atau estimasi kilogram.

## 2. Kanal Pengguna

Kanal utama pengguna adalah WhatsApp.

Pengguna cukup:

1. Mengirim pesan.
2. Mengirim foto.
3. Mengirim alamat atau share location.

Jangan paksa pengguna mengisi form panjang.

## 3. Bahasa WhatsApp

Gunakan bahasa Indonesia sederhana, sopan, dan dekat dengan pengguna.

Contoh baik:

```text
Siap, permintaan jemput sampah sudah kami terima.
Mohon kirim foto sampah agar kami bisa cek perkiraan volumenya.
```

Contoh yang dihindari:

```text
Silakan klasifikasikan jenis material berdasarkan kategori PET/HDPE/organik/residu.
```

## 4. Istilah Layanan

Gunakan istilah publik:

| Istilah Sistem | Istilah Pengguna |
|---|---|
| REGULAR_HOUSEHOLD_PICKUP | Jemput sampah rumah tangga |
| ONE_TRIP_TRICYCLE | Angkut 1 kali jalan motor sampah |
| EXTRA_TRIP_REQUIRED | Kemungkinan perlu tambahan jalan |
| VOLUME LARGE | Volume cukup besar |
| OVERSIZED | Volume sangat besar |

## 5. Warna UI

Gunakan warna sederhana:

| Fungsi | Warna |
|---|---|
| Hijau utama | #16A34A |
| Hijau gelap | #166534 |
| Background | #F8FAFC |
| Warning | #F59E0B |
| Danger | #DC2626 |
| Text utama | #0F172A |
| Text sekunder | #64748B |

## 6. Status Badge

Gunakan badge warna:

| Status | Warna |
|---|---|
| Tiket Baru | Biru |
| Butuh Data | Kuning |
| Perlu Dicek | Orange |
| Dijadwalkan | Ungu |
| Petugas Ditugaskan | Biru tua |
| Dalam Penjemputan | Cyan |
| Selesai | Hijau |
| Butuh Extra Trip | Merah/Orange |
| Ditolak | Merah |
| Dibatalkan | Abu |

## 7. Dashboard Operator

Dashboard operator harus mengutamakan:

- tiket terbaru,
- tiket butuh tindakan,
- foto sampah,
- ringkasan AI,
- tombol aksi cepat.

Jangan membuat dashboard seperti laporan rumit pada MVP.

## 8. Card Tiket

Card tiket minimal menampilkan:

- ticket code,
- nama/nomor,
- kecamatan,
- status,
- estimasi volume,
- estimasi bak motor,
- ringkasan AI pendek,
- tombol detail.

## 9. PWA Petugas

PWA petugas harus mobile-first.

Tombol prioritas:

1. Buka Maps
2. Chat WA
3. Mulai
4. Upload Bukti
5. Selesai
6. Extra Trip

Jangan gunakan tabel di layar petugas.

## 10. Foto Sampah

Foto adalah data penting.

UI harus:

- menampilkan thumbnail,
- bisa diperbesar,
- bisa dibandingkan dengan bukti pickup,
- menampilkan label kualitas foto dari AI.

## 11. Copywriting Balasan WhatsApp

### Tiket dibuat

```text
Siap, permintaan jemput sampah sudah kami terima.

Nomor tiket: JSP-20260613-0001

Operator akan mengonfirmasi jadwal penjemputan.
```

### Minta foto

```text
Agar kami bisa cek perkiraan volume sampahnya, mohon kirim foto sampah dari jarak yang cukup jelas.
```

### Minta alamat

```text
Mohon kirim alamat lengkap atau share location WhatsApp agar petugas mudah menemukan lokasi.
```

### Volume besar

```text
Dari foto, volume terlihat cukup besar dan kemungkinan cocok untuk 1 kali jalan motor sampah. Operator akan mengonfirmasi jadwalnya.
```

### Luar wilayah

```text
Mohon maaf, untuk tahap awal layanan jemput sampah baru tersedia di Watang Sawitto dan Paleteang.
```

## 12. Hindari Hal Berikut

1. Bahasa teknis berlebihan.
2. Form terlalu panjang.
3. Terlalu banyak menu di awal.
4. Menampilkan angka kg dari AI.
5. Menampilkan harga final dari AI.
6. Membuat pengguna bingung dengan status internal.
