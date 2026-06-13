# 07 — Driver PWA dan Workflow Lapangan

Dokumen ini mengarahkan perbaikan PWA petugas agar nyaman dipakai di HP saat kerja lapangan.

---

## 1. Prinsip PWA driver

Driver tidak butuh dashboard penuh. Driver hanya butuh:

- daftar pickup hari ini,
- alamat/lokasi,
- tombol buka maps,
- tombol chat warga,
- foto sampah dari warga,
- catatan operator,
- tombol mulai,
- upload bukti,
- pilih hasil lapangan.

Jangan gunakan tabel pada PWA driver. Gunakan card besar.

---

## 2. Route driver

```text
/driver
/driver/pickups
/driver/pickups/:id
```

Aturan akses:

- Hanya role `DRIVER`.
- Driver hanya melihat tiket dengan `assignedDriverId == auth.uid`.
- Jika role bukan driver, tampilkan akses ditolak.
- Jika belum login, redirect ke login.

---

## 3. Daftar pickup hari ini

Card pickup menampilkan:

- ticket code,
- nama/nomor warga disingkat,
- kecamatan,
- kelurahan,
- lingkungan/zona jika ada,
- alamat pendek,
- jadwal waktu,
- volume AI,
- status,
- indikator bukti pending upload jika ada.

Tombol cepat:

- `Buka Maps`,
- `Chat Warga`,
- `Detail`,
- `Mulai`.

Urutan list:

1. `IN_PROGRESS`,
2. `ASSIGNED` jadwal terdekat,
3. `EXTRA_TRIP_REQUIRED` jika ditugaskan ulang,
4. lainnya.

---

## 4. Detail pickup

Tampilkan:

1. Alamat besar dan jelas.
2. Peta kecil atau koordinat.
3. Tombol `Buka Rute`.
4. Tombol `Chat Warga`.
5. Foto sampah dari warga.
6. Ringkasan AI singkat.
7. Catatan operator.
8. Tombol aksi lapangan.

Jangan tampilkan:

- raw payload WhatsApp,
- raw AI output,
- data laporan admin,
- tiket driver lain.

---

## 5. Tombol aksi lapangan

Tombol utama:

```text
Mulai Penjemputan
Buka Maps
Chat Warga
Upload Foto Sebelum
Upload Foto Sesudah
Selesai 1 Trip
Butuh Extra Trip
Warga Tidak Ada
Sampah Belum Disiapkan
Lokasi Tidak Sesuai
Batal di Lokasi
```

Gunakan reason code:

```ts
type DriverPickupResult =
  | 'COMPLETED_ONE_TRIP'
  | 'PARTIAL_PICKUP'
  | 'EXTRA_TRIP_REQUIRED'
  | 'CUSTOMER_NOT_AVAILABLE'
  | 'WASTE_NOT_READY'
  | 'LOCATION_NOT_FOUND'
  | 'ACCESS_BLOCKED'
  | 'HAZARDOUS_WASTE_FOUND'
  | 'CANCELLED_ON_SITE';
```

Mapping status:

| Result | Status tiket |
|---|---|
| COMPLETED_ONE_TRIP | COMPLETED |
| PARTIAL_PICKUP | EXTRA_TRIP_REQUIRED atau NEEDS_OPERATOR_REVIEW |
| EXTRA_TRIP_REQUIRED | EXTRA_TRIP_REQUIRED |
| CUSTOMER_NOT_AVAILABLE | ASSIGNED atau CANCELLED sesuai kebijakan operator |
| WASTE_NOT_READY | ASSIGNED atau NEEDS_OPERATOR_REVIEW |
| LOCATION_NOT_FOUND | NEEDS_OPERATOR_REVIEW |
| ACCESS_BLOCKED | NEEDS_OPERATOR_REVIEW |
| HAZARDOUS_WASTE_FOUND | NEEDS_OPERATOR_REVIEW |
| CANCELLED_ON_SITE | CANCELLED |

Untuk MVP, jangan terlalu otomatis membatalkan. Lebih aman: status bermasalah kembali ke operator review, kecuali driver memilih hasil yang memang terminal dan kebijakan jelas.

---

## 6. Bukti foto

Aturan:

- Minimal satu foto wajib untuk menyelesaikan pickup.
- Foto dikompresi sebelum upload/simpan.
- Tampilkan preview sebelum kirim.
- Jika koneksi buruk, simpan antrean lokal.
- Jangan kirim foto ukuran besar langsung.

Rekomendasi kompresi:

```ts
const PHOTO_MAX_WIDTH = 1280;
const PHOTO_MAX_HEIGHT = 1280;
const PHOTO_JPEG_QUALITY = 0.72;
const PHOTO_MAX_BYTES = 300_000;
```

Validasi:

- hanya JPEG/PNG input,
- output simpan sebagai JPEG,
- ukuran setelah kompresi maksimal 300 KB jika pakai Firestore fallback,
- jika tetap lebih besar, turunkan quality bertahap.

---

## 7. Offline-friendly

Minimal untuk MVP:

- cache daftar pickup hari ini,
- cache detail pickup,
- simpan draft hasil pickup di IndexedDB,
- antre upload bukti jika gagal,
- retry saat online,
- tampilkan badge `Menunggu sinkronisasi`.

Struktur antrean:

```ts
interface PendingDriverCompletion {
  id: string;
  pickupRequestId: string;
  driverId: string;
  result: DriverPickupResult;
  driverNotes?: string;
  beforePhotos: LocalPhoto[];
  afterPhotos: LocalPhoto[];
  createdAt: string;
  retryCount: number;
  lastError?: string;
}
```

Aturan UX:

- Jangan membuat driver bingung apakah tugas sudah selesai.
- Jika data masih pending, tampilkan jelas:

```text
Data tersimpan di HP dan akan dikirim otomatis saat internet kembali stabil.
Jangan hapus cache browser sampai sinkronisasi selesai.
```

---

## 8. Catatan driver jangan panjang

Gunakan quick notes:

- `Sampah sudah diangkut semua.`
- `Sampah lebih banyak dari foto.`
- `Warga tidak ada di lokasi.`
- `Alamat sulit ditemukan.`
- `Jalan tidak bisa dilalui kendaraan.`
- `Sampah belum disiapkan.`
- `Ada barang berbahaya/perlu arahan operator.`

Driver boleh menambah catatan manual, tetapi jangan wajib kecuali untuk extra trip/gagal.

---

## 9. Keselamatan kerja

Jika driver menandai sampah berbahaya:

- Jangan otomatis selesai.
- Status masuk operator review.
- Tampilkan pesan:

```text
Jangan lanjutkan pengangkutan jika ada benda tajam, bahan kimia, limbah medis, atau sampah yang berisiko. Hubungi operator untuk arahan.
```

Tambahkan tombol `Hubungi Operator` jika nomor operator dikonfigurasi.

---

## 10. Acceptance criteria driver

- [ ] Driver hanya melihat tiket miliknya.
- [ ] Driver bisa membuka maps dari koordinat/alamat.
- [ ] Driver bisa chat warga via WhatsApp.
- [ ] Driver bisa mulai penjemputan.
- [ ] Driver tidak bisa menyelesaikan tanpa bukti foto.
- [ ] Foto dikompresi sebelum disimpan/upload.
- [ ] Hasil extra trip wajib catatan.
- [ ] Warga tidak ada/lokasi salah/sampah belum siap tercatat sebagai reason code.
- [ ] Upload gagal masuk antrean retry.
- [ ] Operator bisa melihat hasil lapangan dan bukti foto.
- [ ] PWA nyaman dipakai di layar kecil.
