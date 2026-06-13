# 07 — Driver PWA Specification

## 1. Tujuan PWA Petugas

PWA petugas digunakan oleh petugas jemput sampah di lapangan. Aplikasi harus ringan, mudah dibuka dari HP, dan tetap nyaman saat koneksi tidak stabil.

Petugas tidak perlu melihat seluruh sistem. Petugas hanya perlu:

- melihat pickup hari ini,
- membuka lokasi,
- menghubungi customer,
- upload bukti foto,
- menyelesaikan pickup,
- menandai extra trip jika perlu.

## 2. Role

Hanya role `DRIVER` yang bisa mengakses.

## 3. Route Utama

```text
/driver
/driver/pickups
/driver/pickups/:id
```

## 4. Login

Gunakan Firebase Auth.

Setelah login, sistem cek role di koleksi `users`.

Jika bukan `DRIVER`, tampilkan akses ditolak.

## 5. Halaman Pickup Hari Ini

Route:

```text
/driver/pickups
```

Tampilkan card per pickup:

- Ticket code
- Nama/nomor customer
- Kecamatan
- Alamat
- Estimasi volume AI
- Estimasi bak motor
- Waktu jemput
- Status

Tombol cepat:

- Buka Maps
- Chat WhatsApp
- Detail
- Mulai

## 6. Detail Pickup

Route:

```text
/driver/pickups/:id
```

Tampilkan:

1. Data customer.
2. Alamat lengkap.
3. Peta/lokasi.
4. Foto sampah dari customer.
5. Catatan operator.
6. Estimasi AI.
7. Tombol aksi.

## 7. Aksi Petugas

### 7.1 Mulai Penjemputan

Tombol:

`Mulai Penjemputan`

Efek:

- Status tiket menjadi `IN_PROGRESS`.
- Catat timestamp.

### 7.2 Buka Maps

Tombol membuka Google Maps dengan koordinat customer.

Jika koordinat tidak ada, buka pencarian alamat.

### 7.3 Chat WhatsApp Customer

Buka URL:

```text
https://wa.me/<nomor>
```

### 7.4 Upload Bukti

Petugas upload:

- Foto sebelum diangkut.
- Foto setelah diangkut.

Minimal salah satu bukti wajib untuk menandai selesai.

### 7.5 Selesai 1 Trip

Status:

`COMPLETED`

actualTripResult:

`COMPLETED_ONE_TRIP`

### 7.6 Butuh Extra Trip

Status:

`EXTRA_TRIP_REQUIRED`

actualTripResult:

`EXTRA_TRIP_REQUIRED`

Petugas wajib isi catatan:

- alasan extra trip,
- estimasi sisa volume,
- apakah perlu jadwal ulang.

### 7.7 Customer Tidak Ada

actualTripResult:

`CUSTOMER_NOT_AVAILABLE`

Status bisa tetap `ASSIGNED` atau menjadi `CANCELLED_ON_SITE` sesuai kebijakan operator.

## 8. Offline-Friendly

Untuk MVP, minimal lakukan:

- Cache daftar pickup hari ini.
- Cache detail pickup.
- Jika upload gagal, tampilkan status pending.
- Sinkronisasi ulang saat online.

Tidak perlu offline mode kompleks pada MVP pertama.

## 9. UI PWA

Desain harus mobile-first.

Elemen besar dan mudah disentuh:

- Tombol Buka Maps.
- Tombol Chat WA.
- Tombol Upload Foto.
- Tombol Selesai.
- Tombol Extra Trip.

Jangan gunakan tabel di PWA petugas. Gunakan card.

## 10. Validasi

Petugas tidak boleh menyelesaikan pickup jika:

- tiket bukan miliknya,
- status belum `ASSIGNED` atau `IN_PROGRESS`,
- belum ada bukti foto,
- tidak ada hasil aktual dipilih.

## 11. Data yang Dikirim saat Selesai

```json
{
  "actualTripResult": "COMPLETED_ONE_TRIP",
  "beforePhotoUrls": ["..."],
  "afterPhotoUrls": ["..."],
  "driverNotes": "Sampah selesai diangkut 1 kali jalan"
}
```

## 12. Prinsip PWA Petugas

1. Cepat dibuka.
2. Hemat klik.
3. Tidak banyak form.
4. Bisa langsung maps dan WA.
5. Bukti foto wajib.
6. Catatan lapangan sederhana.
