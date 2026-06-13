# 06 — Admin Dashboard Specification

## 1. Tujuan Dashboard

Dashboard operator adalah pusat kendali operasional. Operator harus bisa melihat tiket masuk, mengecek hasil AI, memverifikasi data pengguna, menjadwalkan pickup, menugaskan petugas, dan melihat laporan.

Dashboard harus sederhana, cepat, dan jelas.

## 2. Role yang Mengakses

1. `SUPER_ADMIN`
2. `OPERATOR`

## 3. Menu Utama

1. Dashboard Ringkasan
2. Tiket Masuk
3. Jadwal Pickup
4. Peta Pickup
5. Petugas
6. Pelanggan
7. Laporan
8. Pengaturan

## 4. Dashboard Ringkasan

Route:

```text
/admin
```

Widget ringkasan:

- Tiket baru hari ini
- Tiket butuh data
- Tiket perlu dicek operator
- Pickup dijadwalkan hari ini
- Pickup selesai hari ini
- Extra trip
- Tiket Watang Sawitto
- Tiket Paleteang

## 5. Halaman Tiket Masuk

Route:

```text
/admin/tickets
```

Fitur:

- List tiket terbaru.
- Filter status.
- Filter kecamatan.
- Filter jenis layanan.
- Filter volume.
- Search ticket code, nama, nomor WA.

Kolom tabel:

| Kolom | Isi |
|---|---|
| Ticket Code | JSP-YYYYMMDD-0001 |
| Waktu Masuk | Tanggal/jam |
| Customer | Nama/nomor WA |
| Kecamatan | Watang Sawitto/Paleteang |
| Layanan | Reguler/1 kali jalan |
| Volume AI | Kecil/Sedang/Besar/Sangat besar |
| Estimasi Bak | 25/50/75/100/lebih |
| Status | Badge status |
| Aksi | Detail/Jadwalkan/Tolak |

## 6. Detail Tiket

Route:

```text
/admin/tickets/:id
```

Bagian detail:

### 6.1 Informasi Customer

- Nama
- Nomor WhatsApp
- Kecamatan
- Alamat
- Lokasi map
- Riwayat tiket sebelumnya

### 6.2 Foto Sampah

- Galeri foto sampah dari pengguna
- Tombol perbesar foto
- Label kualitas foto dari AI

### 6.3 Hasil AI

Tampilkan:

- Intent
- Volume level
- Estimasi bak motor
- Jenis sampah terdeteksi
- Safety flags
- Rekomendasi layanan
- Confidence
- Ringkasan operator

### 6.4 Riwayat Chat

Tampilkan pesan WhatsApp terkait tiket:

- Pesan masuk
- Balasan sistem
- Waktu pesan

### 6.5 Aksi Operator

Tombol:

- Konfirmasi
- Minta data tambahan
- Jadwalkan
- Assign petugas
- Tolak
- Batalkan
- Tandai extra trip

## 7. Jadwal Pickup

Route:

```text
/admin/schedules
```

Fitur:

- Pilih tanggal.
- Filter kecamatan.
- Buat jadwal pickup.
- Tambahkan tiket ke jadwal.
- Assign driver.
- Publish jadwal.

Tampilan:

- Calendar view sederhana.
- List view per hari.
- Group by kecamatan.

## 8. Peta Pickup

Route:

```text
/admin/map
```

Fitur:

- Marker titik pickup.
- Warna berdasarkan status.
- Filter kecamatan.
- Filter tanggal.
- Klik marker untuk lihat detail.
- Buka di Google Maps.

## 9. Petugas

Route:

```text
/admin/drivers
```

Fitur:

- Tambah petugas.
- Edit petugas.
- Aktif/nonaktif.
- Lihat tugas hari ini.
- Lihat jumlah pickup selesai.

Data petugas:

- Nama
- Nomor HP
- Role DRIVER
- Status aktif
- Catatan

## 10. Pelanggan

Route:

```text
/admin/customers
```

Fitur:

- List pelanggan dari WhatsApp.
- Search nomor HP/nama.
- Filter kecamatan.
- Lihat histori pickup.
- Edit alamat.
- Tambah catatan.

## 11. Laporan

Route:

```text
/admin/reports
```

Laporan minimal:

1. Total tiket masuk.
2. Total pickup selesai.
3. Total dibatalkan.
4. Total ditolak.
5. Total extra trip.
6. Total per kecamatan.
7. Total per jenis layanan.
8. Total per volume level.
9. Total pickup per petugas.

Fitur export:

- CSV
- XLSX
- PDF fase berikutnya

## 12. Pengaturan

Route:

```text
/admin/settings
```

Pengaturan MVP:

- Wilayah layanan aktif.
- Template balasan WhatsApp.
- Jam layanan.
- Status layanan aktif/nonaktif.
- Nomor admin.
- Daftar safety flags.

## 13. Status Badge UI

Gunakan label bahasa Indonesia:

| Status Sistem | Label UI |
|---|---|
| NEW | Tiket Baru |
| NEEDS_INFO | Butuh Data |
| NEEDS_OPERATOR_REVIEW | Perlu Dicek |
| CONFIRMED | Dikonfirmasi |
| SCHEDULED | Dijadwalkan |
| ASSIGNED | Petugas Ditugaskan |
| IN_PROGRESS | Dalam Penjemputan |
| COMPLETED | Selesai |
| EXTRA_TRIP_REQUIRED | Butuh Extra Trip |
| REJECTED | Ditolak |
| CANCELLED | Dibatalkan |

## 14. Prinsip UX Dashboard

1. Operator harus paham kondisi tiket dalam 5 detik.
2. Foto harus mudah dibuka.
3. AI summary harus tampil jelas.
4. Jangan tampilkan data teknis terlalu ramai.
5. Gunakan warna status yang konsisten.
6. Semua aksi penting harus butuh konfirmasi.
7. Jangan hapus data, gunakan status batal/tolak.
