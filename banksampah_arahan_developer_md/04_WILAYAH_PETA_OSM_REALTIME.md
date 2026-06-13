# 04 — Wilayah Layanan, Kelurahan, Lingkungan, dan Peta OSM

Dokumen ini mengarahkan penguatan fitur wilayah dan peta operasional agar aplikasi lebih siap dipakai di Kecamatan Watang Sawitto dan Paleteang.

---

## 1. Tujuan

Fitur wilayah dan peta harus membantu:

- warga memilih/menjelaskan lokasi dengan mudah,
- operator memverifikasi area layanan,
- operator menyusun jadwal per wilayah,
- driver menemukan titik jemput,
- admin membaca laporan per kecamatan/kelurahan/lingkungan.

Yang disebut “realtime” adalah:

- status tiket realtime,
- titik pickup realtime dari data aplikasi,
- posisi driver realtime jika nanti diaktifkan,
- perubahan jadwal realtime.

Peta dasar OpenStreetMap bukan data lalu lintas realtime.

---

## 2. Master data wilayah

Buat file:

```text
src/shared/constants/regions.ts
```

Isi minimal:

```ts
export type DistrictId = 'watang-sawitto' | 'paleteang';

export interface ServiceDistrict {
  id: DistrictId;
  name: string;
  aliases: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface ServiceVillage {
  id: string;
  districtId: DistrictId;
  name: string;
  aliases: string[];
  isActive: boolean;
  sortOrder: number;
  center?: { lat: number; lng: number };
}

export interface ServiceEnvironment {
  id: string;
  villageId: string;
  districtId: DistrictId;
  name: string;
  aliases: string[];
  zoneCode?: string;
  isActive: boolean;
  sortOrder: number;
}

export const SERVICE_DISTRICTS: ServiceDistrict[] = [
  {
    id: 'watang-sawitto',
    name: 'Watang Sawitto',
    aliases: ['watang sawitto', 'watang sawito', 'sawitto', 'sawito'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'paleteang',
    name: 'Paleteang',
    aliases: ['paleteang'],
    isActive: true,
    sortOrder: 2,
  },
];
```

Catatan:

- Lengkapi daftar kelurahan berdasarkan data resmi/lapangan.
- Jangan hardcode data kelurahan di komponen UI.
- Gunakan master data untuk form, filter, laporan, dan normalisasi AI.

---

## 3. Lingkungan/zona jemput

Tambahkan dukungan opsional untuk lingkungan/zona.

Kenapa opsional?

- Data lingkungan bisa berbeda antar kelurahan.
- Belum tentu semua data tersedia pada awal pilot.
- Jangan sampai input warga gagal hanya karena belum ada lingkungan.

Field yang disarankan:

```ts
environmentId?: string;
environmentName?: string;
zoneCode?: string;
```

Contoh use case:

```text
Kecamatan: Watang Sawitto
Kelurahan: Penrang
Lingkungan/Zona: Lingkungan A / Zona WS-01
```

Jika data lingkungan belum lengkap, operator tetap bisa jadwalkan berdasarkan kelurahan.

---

## 4. Normalisasi input wilayah

Buat helper:

```text
src/shared/regions/normalize-region.ts
```

Fungsi:

```ts
export function normalizeDistrictName(input: string): {
  districtId: DistrictId | 'out-of-area' | 'unknown';
  districtName: string;
  confidence: number;
} {
  // Cocokkan input dengan name dan aliases.
}
```

Contoh expected:

| Input | Output |
|---|---|
| `Watang Sawito` | `Watang Sawitto` |
| `sawitto` | `Watang Sawitto` |
| `paleteang` | `Paleteang` |
| `suppa` | `Luar Wilayah` |
| kosong | `Belum Diketahui` |

AI boleh membaca typo, tetapi database utama tetap harus memakai nama resmi.

---

## 5. Peta operator berbasis OSM/Leaflet

Route:

```text
/admin/map
```

Fitur wajib:

- marker pickup aktif,
- filter tanggal,
- filter status,
- filter kecamatan,
- filter kelurahan,
- klik marker buka ringkasan tiket,
- tombol buka detail tiket,
- tombol buka Google Maps/OSM route.

Marker warna/status:

| Status | Tampilan |
|---|---|
| NEW | abu/biru muda |
| NEEDS_INFO | kuning |
| NEEDS_OPERATOR_REVIEW | oranye |
| SCHEDULED | biru |
| ASSIGNED | ungu |
| IN_PROGRESS | hijau |
| COMPLETED | hijau tua / hidden default |
| EXTRA_TRIP_REQUIRED | merah/oranye |
| REJECTED/CANCELLED | abu redup / hidden default |

Jangan menampilkan semua tiket lama sekaligus. Default:

- hari ini,
- besok,
- status belum selesai.

---

## 6. Peta untuk driver

Driver tidak perlu peta kompleks.

Di halaman detail pickup, tampilkan:

- alamat,
- kecamatan,
- kelurahan,
- lingkungan/zona jika ada,
- jarak dari posisi driver jika izin lokasi aktif,
- tombol `Buka Rute`.

Tombol rute:

```ts
export function buildGoogleMapsRouteUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
```

Jika tidak ada koordinat:

```ts
export function buildMapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
```

---

## 7. Validasi lokasi warga

Wizard warga atau data dari WhatsApp harus mendukung:

- alamat teks,
- share location WhatsApp,
- GPS browser,
- pilihan kecamatan,
- pilihan kelurahan.

Jika tidak ada lokasi, status:

```text
NEEDS_INFO
```

Balasan:

```text
Baik, permintaan jemput sampah bisa kami bantu. Mohon kirim alamat lengkap atau share location WhatsApp agar petugas mudah menemukan lokasi.
Untuk tahap awal layanan tersedia di Watang Sawitto dan Paleteang.
```

---

## 8. Laporan wilayah

Laporan harus mendukung breakdown:

- total tiket per kecamatan,
- total tiket per kelurahan,
- pickup selesai per kelurahan,
- extra trip per kelurahan,
- tiket gagal per kelurahan,
- volume dominan per wilayah,
- titik yang sering bermasalah.

Jangan tampilkan nomor WhatsApp pada laporan standar.

---

## 9. Data boundary GeoJSON

Untuk MVP, boundary kelurahan tidak wajib. Namun struktur harus siap.

Simpan file nanti di:

```text
public/geojson/pinrang/watang-sawitto/*.geojson
public/geojson/pinrang/paleteang/*.geojson
```

Aturan:

- File boundary harus berasal dari sumber terbuka/resmi yang boleh dipakai.
- Cantumkan sumber pada `public/geojson/SOURCES.md`.
- Jika boundary belum valid, jangan pakai untuk keputusan layanan otomatis; gunakan sebagai visual bantu operator.

---

## 10. Acceptance criteria wilayah/peta

- [ ] Semua UI memakai “Watang Sawitto”.
- [ ] Input “Sawito” tetap dikenali sebagai alias.
- [ ] Tiket punya `districtId` dan `districtName`.
- [ ] Tiket baru bisa menyimpan `villageId` dan `villageName`.
- [ ] Lingkungan/zona opsional tidak membuat tiket gagal.
- [ ] Operator bisa filter tiket per kelurahan.
- [ ] Peta operator menampilkan marker pickup aktif.
- [ ] Driver bisa buka rute dari detail pickup.
- [ ] Laporan bisa breakdown per kecamatan dan kelurahan.
