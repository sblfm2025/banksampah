# 06 — Dashboard Operator dan Workflow Bank Sampah

Dokumen ini mengarahkan perbaikan dashboard operator agar aplikasi membantu pekerjaan, bukan menambah beban.

---

## 1. Prinsip dashboard operator

Operator harus bisa memahami kondisi layanan dalam 5 detik.

Dashboard tidak boleh hanya menjadi tabel data. Dashboard harus menjadi pusat keputusan:

- tiket mana yang perlu diproses dulu,
- siapa driver yang ditugaskan,
- area mana yang padat,
- pickup mana yang gagal,
- mana yang butuh extra trip,
- mana yang berisiko sampah berbahaya.

---

## 2. Halaman ringkasan `/admin`

Widget wajib:

| Widget | Keterangan |
|---|---|
| Tiket baru hari ini | Status `NEW` |
| Butuh data | Status `NEEDS_INFO` |
| Perlu dicek operator | Status `NEEDS_OPERATOR_REVIEW` |
| Dijadwalkan hari ini | `scheduledDate = today` |
| Ditugaskan | Status `ASSIGNED` |
| Dalam penjemputan | Status `IN_PROGRESS` |
| Selesai hari ini | Status `COMPLETED`, tanggal selesai hari ini |
| Extra trip | Status `EXTRA_TRIP_REQUIRED` |
| Safety flag | Ada flag B3/medis/bahan kimia |
| Luar wilayah | Waitlist / out-of-area |

Tambahkan antrean cepat:

```text
Perlu Tindakan Sekarang
1. Tiket safety flag
2. Tiket pickup hari ini belum assign driver
3. Tiket NEEDS_INFO > 2 jam
4. Tiket IN_PROGRESS terlalu lama
5. Tiket EXTRA_TRIP_REQUIRED
```

---

## 3. Halaman tiket `/admin/tickets`

Filter wajib:

- status,
- tanggal masuk,
- tanggal jadwal,
- kecamatan,
- kelurahan,
- driver,
- jenis layanan,
- volume AI,
- safety flag,
- search ticket code,
- search nomor WA/nama.

Kolom prioritas:

| Kolom | Isi |
|---|---|
| Tiket | `JSP-YYYYMMDD-0001` |
| Masuk | waktu masuk |
| Warga | nama/nomor disingkat |
| Wilayah | kecamatan + kelurahan |
| Layanan | reguler / 1 trip |
| Volume | kecil/sedang/besar/sangat besar |
| AI | confidence + flag |
| Jadwal | tanggal + window |
| Driver | nama driver |
| Status | badge |
| Aksi | detail / jadwalkan / assign |

Jangan tampilkan raw payload di list.

---

## 4. Detail tiket `/admin/tickets/:id`

Susunan halaman:

1. Header tiket:
   - ticket code,
   - status,
   - tanggal masuk,
   - sumber.

2. Informasi warga:
   - nama,
   - nomor WA,
   - alamat,
   - kecamatan,
   - kelurahan,
   - lingkungan/zona,
   - lokasi map.

3. Foto sampah:
   - galeri,
   - zoom,
   - label kualitas foto,
   - catatan “estimasi visual, bukan berat pasti”.

4. Hasil AI:
   - intent,
   - ringkasan operator,
   - volume,
   - estimasi bak,
   - jenis sampah,
   - safety flag,
   - confidence.

5. Riwayat chat:
   - pesan masuk,
   - balasan sistem,
   - waktu,
   - lampiran.

6. Operasional:
   - jadwal,
   - driver,
   - catatan operator,
   - catatan driver,
   - bukti pickup,
   - audit log ringkas.

---

## 5. Aksi operator

Aksi harus tersedia sesuai status, bukan semua tombol muncul sekaligus.

| Status | Aksi yang boleh |
|---|---|
| NEW | konfirmasi, minta data, tolak |
| NEEDS_INFO | kirim/minta data, tolak, review manual |
| NEEDS_OPERATOR_REVIEW | konfirmasi, minta data, tolak |
| CONFIRMED | jadwalkan, tolak, batalkan |
| SCHEDULED | assign driver, ubah jadwal, batalkan |
| ASSIGNED | ubah driver, batalkan, lihat detail |
| IN_PROGRESS | lihat progres, hubungi driver |
| EXTRA_TRIP_REQUIRED | jadwalkan ulang, assign driver, selesai manual jika valid |
| COMPLETED | lihat bukti/laporan |
| REJECTED/CANCELLED | lihat alasan |

Semua aksi penting harus membuka modal konfirmasi.

---

## 6. Alasan penolakan/pembatalan

Tolak/batal tidak boleh tanpa alasan.

Reason code:

```ts
type RejectionReason =
  | 'OUT_OF_SERVICE_AREA'
  | 'HAZARDOUS_WASTE'
  | 'INVALID_REQUEST'
  | 'NO_RESPONSE_FROM_CUSTOMER'
  | 'INSUFFICIENT_INFORMATION'
  | 'OPERATIONAL_CAPACITY_FULL'
  | 'OTHER';
```

UI menampilkan label Indonesia:

| Code | Label |
|---|---|
| OUT_OF_SERVICE_AREA | Di luar wilayah layanan |
| HAZARDOUS_WASTE | Perlu penanganan khusus/B3 |
| INVALID_REQUEST | Permintaan tidak valid |
| NO_RESPONSE_FROM_CUSTOMER | Warga tidak merespons |
| INSUFFICIENT_INFORMATION | Data belum cukup |
| OPERATIONAL_CAPACITY_FULL | Kapasitas operasional penuh |
| OTHER | Lainnya |

---

## 7. Penjadwalan pickup

Halaman `/admin/schedules` harus mendukung:

- pilih tanggal,
- group by kecamatan,
- group by kelurahan,
- filter driver,
- assign beberapa tiket ke driver,
- lihat kapasitas kasar per driver,
- publish jadwal,
- ubah jadwal.

Jangan membuat optimasi rute kompleks dulu. Cukup bantu operator mengelompokkan wilayah.

Kapasitas kasar:

```ts
const LOAD_SCORE = {
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 3,
  OVERSIZED: 5,
  UNKNOWN: 2,
};
```

Tampilkan warning jika total load score driver terlalu tinggi.

---

## 8. Petugas `/admin/drivers`

Fitur:

- tambah profil driver,
- aktif/nonaktif,
- lihat tugas hari ini,
- lihat tugas berjalan,
- lihat jumlah pickup selesai,
- nomor WA driver,
- area/zona biasa bertugas.

Data:

```ts
interface DriverProfile {
  uid: string;
  name: string;
  phoneNumber: string;
  isActive: boolean;
  defaultDistrictIds?: string[];
  defaultVillageIds?: string[];
  vehicleType?: 'TRICYCLE' | 'MOTORCYCLE' | 'PICKUP' | 'OTHER';
  notes?: string;
}
```

---

## 9. Laporan `/admin/reports`

Laporan minimal:

- total tiket masuk,
- total selesai,
- total batal,
- total ditolak,
- total extra trip,
- completion rate,
- breakdown kecamatan,
- breakdown kelurahan,
- breakdown jenis layanan,
- breakdown volume,
- pickup per driver,
- kasus gagal per alasan.

Filter:

- rentang tanggal maksimal 31 hari,
- kecamatan,
- kelurahan,
- driver,
- status.

Export CSV standar tidak boleh menyertakan nomor WhatsApp lengkap.

Contoh masking:

```ts
export function maskPhone(phone: string) {
  return phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2');
}
```

---

## 10. Acceptance criteria operator

- [ ] Operator paham antrean prioritas dalam 5 detik.
- [ ] Filter status/kecamatan/kelurahan/tanggal berjalan dari query Firestore, bukan sekadar filter lokal 100 data.
- [ ] Detail tiket menampilkan foto, AI summary, lokasi, chat, dan audit ringkas.
- [ ] Penolakan wajib alasan.
- [ ] Jadwal dan assign driver menulis audit log.
- [ ] Extra trip muncul sebagai antrean tindak lanjut.
- [ ] Safety flag muncul jelas.
- [ ] Export laporan tidak bocor nomor WhatsApp lengkap.
- [ ] Operator tidak melihat halaman blank saat data kosong/error.
