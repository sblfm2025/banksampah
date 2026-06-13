# ARAHAN TEKNIS WILAYAH LAYANAN & PETA OPENSTREETMAP
# Aplikasi AI Jemput Sampah Pinrang

Versi: 1.0  
Fokus MVP: Kecamatan Watang Sawitto dan Kecamatan Paleteang  
Catatan penulisan: **penulisan yang benar adalah “Sawitto”**, bukan “Sawito”.

---

## 1. Tujuan Dokumen

Dokumen ini menjadi arahan teknis untuk developer dalam mengembangkan fitur wilayah layanan aplikasi **AI Jemput Sampah Pinrang** agar lebih spesifik sampai level:

1. Kecamatan
2. Kelurahan
3. Lingkungan / zona jemput
4. Titik jemput pelanggan
5. Peta operasional berbasis sumber terbuka

Aplikasi harus mendukung peta yang terlihat realtime untuk kebutuhan operasional, khususnya:

- titik permintaan jemput,
- status tiket,
- posisi petugas,
- zona layanan,
- jadwal per kecamatan/kelurahan,
- rute pickup harian.

Yang realtime adalah **data operasional aplikasi** seperti status tiket, titik jemput, dan posisi petugas. Peta dasar OpenStreetMap sendiri bukan data realtime lalu lintas.

---

## 2. Prinsip Produk

Fitur wilayah dan peta harus mengikuti prinsip aplikasi:

> Pengguna tidak dipaksa memahami istilah teknis. Sistem yang harus cerdas membaca lokasi, wilayah layanan, dan kebutuhan jemput.

Untuk warga, tampilan harus sederhana:

- pilih kecamatan,
- pilih kelurahan,
- isi alamat,
- kirim/share lokasi,
- kirim foto sampah.

Untuk operator, tampilan harus lebih lengkap:

- peta semua tiket,
- filter kecamatan,
- filter kelurahan,
- filter status,
- filter estimasi volume,
- lihat posisi petugas,
- susun jadwal pickup.

Untuk petugas, tampilan harus paling sederhana:

- daftar tugas hari ini,
- lokasi jemput,
- tombol buka rute,
- tombol chat pelanggan,
- tombol selesai/extra trip.

---

## 3. Struktur Wilayah Layanan

Gunakan struktur wilayah bertingkat:

```text
Kabupaten Pinrang
└── Kecamatan
    └── Kelurahan
        └── Lingkungan / Zona Jemput
            └── Titik Jemput Pelanggan
```

Pada MVP, layanan aktif hanya untuk:

1. Kecamatan Watang Sawitto
2. Kecamatan Paleteang

Wilayah lain tidak boleh dibuat sebagai tiket aktif otomatis. Jika pengguna berada di luar area layanan, simpan sebagai **waitlist** atau **daftar tunggu pengembangan layanan**.

---

## 4. Master Data Kecamatan

Gunakan ID slug yang konsisten dan tidak berubah.

```ts
export const SERVICE_DISTRICTS = [
  {
    id: 'watang-sawitto',
    name: 'Watang Sawitto',
    aliases: ['Watang Sawitto'],
    isActive: true,
    sortOrder: 1
  },
  {
    id: 'paleteang',
    name: 'Paleteang',
    aliases: ['Paleteang'],
    isActive: true,
    sortOrder: 2
  }
] as const;
```

Catatan penting:

- Jangan gunakan penulisan “Watang Sawito”.
- Jika ada input pengguna yang mengetik “Sawito”, sistem boleh mengenali sebagai typo/alias, tetapi output UI dan database utama tetap harus menampilkan **Sawitto**.
- Semua label UI, laporan, export, dan dashboard harus memakai “Sawitto”.

---

## 5. Master Data Kelurahan

### 5.1 Kecamatan Watang Sawitto

Master kelurahan awal:

```ts
export const WATANG_SAWITTO_VILLAGES = [
  { id: 'siparappe', districtId: 'watang-sawitto', name: 'Siparappe', aliases: [] },
  { id: 'sipatokkong', districtId: 'watang-sawitto', name: 'Sipatokkong', aliases: [] },
  { id: 'salo', districtId: 'watang-sawitto', name: 'Salo', aliases: [] },
  { id: 'penrang', districtId: 'watang-sawitto', name: 'Penrang', aliases: [] },
  { id: 'jaya', districtId: 'watang-sawitto', name: 'Jaya', aliases: [] },
  { id: 'sawitto', districtId: 'watang-sawitto', name: 'Sawitto', aliases: [] },
  { id: 'maccorawalie', districtId: 'watang-sawitto', name: 'Maccorawalie', aliases: [] },
  { id: 'bentengnge', districtId: 'watang-sawitto', name: 'Bentengnge', aliases: [] }
] as const;
```

### 5.2 Kecamatan Paleteang

Master kelurahan awal:

```ts
export const PALETEANG_VILLAGES = [
  { id: 'benteng-sawitto', districtId: 'paleteang', name: 'Benteng Sawitto', aliases: ['Benteng Sawito'] },
  { id: 'laleng-bata', districtId: 'paleteang', name: 'Laleng Bata', aliases: [] },
  { id: 'macinnae', districtId: 'paleteang', name: 'Macinnae', aliases: [] },
  { id: 'mamminasae', districtId: 'paleteang', name: 'Mamminasae', aliases: [] },
  { id: 'pacongang', districtId: 'paleteang', name: 'Pacongang', aliases: [] },
  { id: 'temmassarangnge', districtId: 'paleteang', name: 'Temmassarangnge', aliases: [] }
] as const;
```

Catatan:

- Nama utama yang tampil harus **Benteng Sawitto**.
- Alias “Benteng Sawito” hanya dipakai untuk pencarian/normalisasi input, bukan label utama.
- Jika sumber eksternal menulis “Sawito”, sistem tetap menormalisasi output ke **Sawitto**.

---

## 6. Lingkungan / Zona Jemput

Untuk level lingkungan, jangan mengarang data jika belum diverifikasi. Buat sistem agar operator bisa menambah dan memperbaiki master data lingkungan dari dashboard.

### 6.1 Prinsip Pengelolaan Lingkungan

- Kelurahan wajib ada.
- Lingkungan opsional pada fase awal.
- Lingkungan dapat diisi manual oleh operator.
- Lingkungan dapat dibuat sebagai zona jemput.
- Jika nama lingkungan belum tersedia, sistem tetap bisa memakai alamat teks dan pin lokasi.
- Setelah data lapangan cukup, operator dapat menstandarkan nama lingkungan.

### 6.2 Contoh Struktur Data Lingkungan

```ts
export interface ServiceNeighborhood {
  id: string;
  districtId: 'watang-sawitto' | 'paleteang';
  villageId: string;
  name: string;
  aliases: string[];
  isActive: boolean;
  center?: {
    lat: number;
    lng: number;
  };
  boundaryGeoJson?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 6.3 Zona Jemput

Selain lingkungan administratif, aplikasi boleh membuat zona operasional:

- Zona Watang Sawitto 1
- Zona Watang Sawitto 2
- Zona Paleteang 1
- Zona Paleteang 2
- Zona Sekolah/Kantor
- Zona Pasar/UMKM
- Zona Event/Angkut Besar

Zona tidak harus sama dengan batas lingkungan resmi. Zona adalah alat operasional armada.

```ts
export interface PickupZone {
  id: string;
  name: string;
  districtId: 'watang-sawitto' | 'paleteang';
  villageIds: string[];
  neighborhoodIds?: string[];
  boundaryGeoJson?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  defaultPickupDays: Array<
    'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  >;
  isActive: boolean;
  sortOrder: number;
}
```

---

## 7. Skema Database Firestore

Tambahkan koleksi berikut.

### 7.1 serviceDistricts

```ts
interface ServiceDistrict {
  id: string;
  name: string;
  aliases: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 7.2 serviceVillages

```ts
interface ServiceVillage {
  id: string;
  districtId: 'watang-sawitto' | 'paleteang';
  name: string;
  aliases: string[];
  isActive: boolean;
  center?: {
    lat: number;
    lng: number;
  };
  boundaryGeoJson?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  neighborhoodCountHint?: number;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 7.3 serviceNeighborhoods

```ts
interface ServiceNeighborhood {
  id: string;
  districtId: 'watang-sawitto' | 'paleteang';
  villageId: string;
  name: string;
  aliases: string[];
  isActive: boolean;
  center?: {
    lat: number;
    lng: number;
  };
  boundaryGeoJson?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 7.4 pickupZones

```ts
interface PickupZone {
  id: string;
  name: string;
  districtId: 'watang-sawitto' | 'paleteang';
  villageIds: string[];
  neighborhoodIds?: string[];
  boundaryGeoJson?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  defaultPickupDays: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 7.5 pickupRequests: Tambahan Field Lokasi

Tambahkan field berikut pada `pickupRequests`:

```ts
interface PickupRequestLocationFields {
  districtId: 'watang-sawitto' | 'paleteang' | 'out-of-area' | 'unknown';
  villageId?: string;
  neighborhoodId?: string;
  pickupZoneId?: string;

  addressText: string;

  location?: {
    lat: number;
    lng: number;
  };

  locationAccuracyMeters?: number;

  locationSource:
    | 'WHATSAPP_SHARE_LOCATION'
    | 'BROWSER_GPS'
    | 'MANUAL_PIN'
    | 'MANUAL_TEXT'
    | 'OPERATOR_INPUT';

  locationValidationStatus:
    | 'INSIDE_SERVICE_AREA'
    | 'OUTSIDE_SERVICE_AREA'
    | 'NEEDS_OPERATOR_REVIEW'
    | 'UNKNOWN';
}
```

---

## 8. Normalisasi Nama Wilayah

Buat file:

```text
src/shared/regions/region-normalizer.ts
```

Fungsi normalisasi dasar:

```ts
export function normalizeRegionText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '');
}
```

Deteksi kecamatan:

```ts
export function detectDistrict(
  input: string
): 'watang-sawitto' | 'paleteang' | 'out-of-area' | 'unknown' {
  const text = normalizeRegionText(input);

  if (
    text.includes('watang sawitto') ||
    text.includes('sawitto') ||
    text.includes('watang sawito')
  ) {
    return 'watang-sawitto';
  }

  if (text.includes('paleteang')) {
    return 'paleteang';
  }

  const knownOutOfArea = [
    'suppa',
    'mattiro bulu',
    'mattirobulu',
    'duampanua',
    'lembang',
    'cempa',
    'patampanua',
    'lanrisang',
    'mattiro sompe',
    'tiroang',
    'batulappa'
  ];

  if (knownOutOfArea.some((area) => text.includes(area))) {
    return 'out-of-area';
  }

  return 'unknown';
}
```

Deteksi kelurahan:

```ts
export function detectVillage(input: string): string | undefined {
  const text = normalizeRegionText(input);

  const villageAliases = [
    { id: 'siparappe', names: ['siparappe'] },
    { id: 'sipatokkong', names: ['sipatokkong'] },
    { id: 'salo', names: ['salo'] },
    { id: 'penrang', names: ['penrang'] },
    { id: 'jaya', names: ['jaya'] },
    { id: 'sawitto', names: ['sawitto', 'sawito'] },
    { id: 'maccorawalie', names: ['maccorawalie'] },
    { id: 'bentengnge', names: ['bentengnge'] },

    { id: 'benteng-sawitto', names: ['benteng sawitto', 'benteng sawito'] },
    { id: 'laleng-bata', names: ['laleng bata'] },
    { id: 'macinnae', names: ['macinnae'] },
    { id: 'mamminasae', names: ['mamminasae'] },
    { id: 'pacongang', names: ['pacongang'] },
    { id: 'temmassarangnge', names: ['temmassarangnge'] }
  ];

  const match = villageAliases.find((item) =>
    item.names.some((name) => text.includes(name))
  );

  return match?.id;
}
```

Catatan:

- Alias `sawito` hanya untuk input typo.
- Output tetap **Sawitto**.
- UI tetap tampil **Watang Sawitto**, **Sawitto**, dan **Benteng Sawitto**.

---

## 9. Peta Sumber Terbuka

Gunakan sumber terbuka untuk peta:

1. OpenStreetMap sebagai sumber data peta.
2. Leaflet atau React Leaflet sebagai library tampilan peta.
3. OSRM untuk routing berbasis OpenStreetMap.
4. Nominatim untuk geocoding/reverse geocoding ringan, dengan pembatasan penggunaan.
5. Firestore/Supabase realtime untuk status tiket dan posisi petugas.

### 9.1 Library Frontend

Install:

```bash
npm install leaflet react-leaflet
npm install @types/leaflet -D
```

Opsional marker cluster:

```bash
npm install react-leaflet-cluster
```

Opsional geospatial helper:

```bash
npm install @turf/turf
```

### 9.2 Komponen Map

Buat folder:

```text
src/app/components/map/
  OpenStreetMapView.tsx
  PickupMarker.tsx
  DriverMarker.tsx
  RegionFilter.tsx
  LocationPicker.tsx
  ServiceAreaLayer.tsx
```

### 9.3 Komponen OpenStreetMapView

```tsx
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export function OpenStreetMapView({
  center = [-3.793, 119.652],
  zoom = 14,
  children
}: {
  center?: [number, number];
  zoom?: number;
  children?: React.ReactNode;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full rounded-2xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
```

Catatan:

- Wajib tampilkan atribusi OpenStreetMap.
- Untuk produksi, pertimbangkan provider tile seperti MapTiler, Stadia, Jawg, Carto, atau self-host tile server.
- Jangan membebani tile server publik OpenStreetMap untuk traffic besar.

---

## 10. Realtime Map

Realtime map bukan berarti peta dasar berubah realtime. Yang realtime adalah data aplikasi.

Gunakan listener:

- `pickupRequests` untuk marker tiket,
- `driverLocations` untuk posisi petugas,
- `pickupSchedules` untuk jadwal harian.

### 10.1 driverLocations

Tambahkan koleksi:

```ts
interface DriverLocation {
  id: string;
  driverId: string;
  driverName: string;
  location: {
    lat: number;
    lng: number;
  };
  accuracyMeters?: number;
  heading?: number;
  speed?: number;
  isOnline: boolean;
  lastUpdatedAt: Timestamp;
}
```

PWA petugas dapat update lokasi berkala hanya saat:

- petugas login,
- sedang bertugas,
- izin lokasi diberikan,
- mode tracking aktif.

Jangan update GPS terus-menerus jika petugas tidak sedang bertugas.

### 10.2 Warna Marker Tiket

Gunakan warna marker berdasarkan status:

```ts
export const PICKUP_MARKER_COLORS = {
  NEW: '#94A3B8',
  NEEDS_INFO: '#F59E0B',
  NEEDS_OPERATOR_REVIEW: '#FB923C',
  CONFIRMED: '#0EA5E9',
  SCHEDULED: '#0284C7',
  ASSIGNED: '#159FB3',
  IN_PROGRESS: '#14B8A6',
  COMPLETED: '#16A34A',
  EXTRA_TRIP_REQUIRED: '#8B5CF6',
  REJECTED: '#DC2626',
  CANCELLED: '#64748B'
};
```

---

## 11. UI untuk Warga

### 11.1 Input Lokasi

Pada form jemput, tampilkan:

1. Kecamatan
2. Kelurahan
3. Lingkungan/Zona, opsional
4. Alamat detail
5. Tombol `Gunakan Lokasi Saat Ini`
6. Peta kecil untuk geser pin

Validasi:

- Jika kecamatan bukan Watang Sawitto/Paleteang:
  > Untuk tahap awal, layanan baru tersedia di Watang Sawitto dan Paleteang. Lokasi Anda kami catat sebagai daftar tunggu.

- Jika kelurahan kosong:
  > Pilih kelurahan agar petugas lebih mudah menjadwalkan rute jemput.

- Jika GPS tidak aktif:
  > Deteksi lokasi belum aktif. Aktifkan GPS atau isi alamat secara manual.

### 11.2 Copywriting

Gunakan bahasa sederhana:

- Lokasi Jemput
- Pilih Kecamatan
- Pilih Kelurahan
- Lingkungan/Zona
- Alamat Lengkap
- Gunakan Lokasi Saat Ini
- Geser pin jika titik belum tepat
- Lokasi masuk area layanan
- Lokasi belum masuk area layanan

---

## 12. UI untuk Operator

Tambahkan halaman:

```text
/admin/regions
/admin/map
```

### 12.1 Admin Region Management

Fitur:

- Lihat daftar kecamatan aktif.
- Lihat daftar kelurahan.
- Tambah/edit lingkungan.
- Tambah/edit zona jemput.
- Aktif/nonaktifkan wilayah.
- Set jadwal default per zona.
- Upload/edit boundary GeoJSON jika tersedia.

### 12.2 Admin Map

Fitur:

- Peta semua tiket.
- Filter tanggal.
- Filter kecamatan.
- Filter kelurahan.
- Filter lingkungan/zona.
- Filter status.
- Filter petugas.
- Klik marker untuk buka detail tiket.
- Lihat posisi petugas jika aktif.
- Lihat layer zona/kelurahan jika GeoJSON tersedia.

---

## 13. UI untuk Petugas

Pada PWA petugas:

- tampilkan kelurahan pada card pickup,
- tampilkan lingkungan/zona jika ada,
- tampilkan alamat detail,
- tombol `Buka Rute`,
- tombol `Chat Pelanggan`,
- tombol `Saya Sudah Sampai`,
- tombol `Selesai 1 Trip`,
- tombol `Butuh Extra Trip`.

Jika GPS aktif:

- petugas dapat update posisi,
- operator melihat posisi petugas di peta,
- lokasi tidak perlu dibagikan ke pelanggan pada MVP.

---

## 14. Routing

Untuk routing sumber terbuka, gunakan OSRM.

Pada MVP, cukup implementasi:

- tombol `Buka Rute` ke aplikasi maps eksternal,
- urutan jemput manual oleh operator,
- preview rute opsional di admin map.

Contoh URL OSRM public/demo untuk pengembangan:

```text
https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson
```

Catatan:

- Jangan bergantung pada OSRM demo server untuk produksi.
- Untuk produksi, self-host OSRM atau gunakan provider routing yang stabil.

---

## 15. Geocoding

Gunakan geocoding secara hati-hati.

Strategi MVP:

1. Utamakan GPS browser/share location WhatsApp.
2. Simpan alamat manual.
3. Reverse geocoding opsional.
4. Jangan geocoding massal.
5. Cache hasil geocoding.
6. Operator bisa koreksi alamat/kelurahan secara manual.

Jika menggunakan Nominatim:

- ikuti usage policy,
- batasi request,
- tambahkan caching,
- gunakan User-Agent yang jelas,
- untuk produksi skala besar gunakan self-host atau provider resmi.

---

## 16. Integrasi AI

AI harus bisa membaca alamat bebas dan membantu menebak wilayah.

Contoh input pengguna:

> Saya di Benteng Sawitto dekat masjid, mau jemput sampah.

AI harus menghasilkan:

```json
{
  "detectedDistrict": "paleteang",
  "detectedVillage": "benteng-sawitto",
  "addressCompleteness": "PARTIAL",
  "needsMoreInfo": true,
  "missingFields": ["LOCATION"],
  "customerReply": "Baik, lokasi terdeteksi di Benteng Sawitto, Paleteang. Mohon kirim share location atau alamat lengkap agar petugas mudah menemukan lokasi."
}
```

Contoh typo:

> Saya di Benteng Sawito.

Sistem boleh mengenali sebagai `benteng-sawitto`, tetapi balasan tetap:

> Baik, lokasi terdeteksi di Benteng Sawitto, Paleteang.

---

## 17. Prompt AI Tambahan

Tambahkan aturan ke prompt Gemini:

```text
Aturan wilayah layanan:
- Penulisan resmi adalah Sawitto, bukan Sawito.
- Jika pengguna mengetik Sawito, anggap sebagai kemungkinan typo dari Sawitto.
- Area layanan aktif hanya Watang Sawitto dan Paleteang.
- Deteksi kelurahan jika disebutkan.
- Untuk Kecamatan Watang Sawitto, kelurahan yang dikenali:
  Siparappe, Sipatokkong, Salo, Penrang, Jaya, Sawitto, Maccorawalie, Bentengnge.
- Untuk Kecamatan Paleteang, kelurahan yang dikenali:
  Benteng Sawitto, Laleng Bata, Macinnae, Mamminasae, Pacongang, Temmassarangnge.
- Jangan membuat tiket aktif untuk luar area layanan.
- Jika lokasi belum lengkap, minta alamat lengkap atau share location.
- Jika lokasi di luar area layanan, jawab bahwa layanan tahap awal baru tersedia di Watang Sawitto dan Paleteang.
```

---

## 18. Acceptance Criteria

Fitur dianggap selesai jika:

1. Master kecamatan Watang Sawitto dan Paleteang tersedia.
2. Master kelurahan untuk kedua kecamatan tersedia.
3. Penulisan UI selalu menggunakan “Sawitto”.
4. Input “Sawito” dapat dikenali sebagai alias/typo, tetapi output tetap “Sawitto”.
5. Tiket pickup menyimpan `districtId`.
6. Tiket pickup menyimpan `villageId` jika tersedia.
7. Tiket pickup menyimpan `neighborhoodId` jika tersedia.
8. Tiket pickup menyimpan koordinat lokasi jika pengguna mengirim GPS/pin.
9. Operator bisa filter tiket berdasarkan kecamatan.
10. Operator bisa filter tiket berdasarkan kelurahan.
11. Operator bisa melihat titik pickup pada peta OpenStreetMap.
12. Operator bisa melihat status tiket secara realtime di peta.
13. Petugas bisa membuka rute dari PWA.
14. Petugas bisa update status pickup dari lapangan.
15. Posisi petugas hanya dilacak saat petugas sedang bertugas dan izin lokasi aktif.
16. Atribusi OpenStreetMap tampil pada peta.
17. Nominatim tidak digunakan untuk geocoding massal.
18. Jika pengguna di luar area layanan, sistem tidak membuat tiket aktif otomatis.
19. Operator bisa menambah/mengubah lingkungan.
20. Operator bisa menambah/mengubah zona jemput.

---

## 19. File yang Perlu Dibuat / Diubah

Tambahkan:

```text
src/shared/regions/
  region.types.ts
  service-areas.ts
  region-normalizer.ts

src/app/components/map/
  OpenStreetMapView.tsx
  PickupMarker.tsx
  DriverMarker.tsx
  RegionFilter.tsx
  LocationPicker.tsx
  ServiceAreaLayer.tsx

src/app/admin/regions/
  RegionManagementPage.tsx
  VillageList.tsx
  NeighborhoodList.tsx
  PickupZoneList.tsx

src/app/admin/map/
  AdminMapPage.tsx
```

Ubah:

```text
src/shared/types/pickup.types.ts
src/server/ai/prompts/waste-analysis.prompt.ts
src/server/ai/schemas/waste-analysis.schema.ts
src/server/services/pickup-ticket.service.ts
src/app/admin/tickets/TicketsPage.tsx
src/app/admin/tickets/TicketDetailPage.tsx
src/app/driver/DriverPickupsPage.tsx
src/app/driver/DriverPickupDetailPage.tsx
```

---

## 20. Catatan Sumber dan Verifikasi

Data master kelurahan dalam dokumen ini disusun sebagai data awal untuk MVP. Developer tetap perlu memberi ruang koreksi dari operator atau sumber resmi daerah.

Referensi teknis:
- Leaflet adalah library JavaScript open-source untuk peta interaktif mobile-friendly.
- OpenStreetMap dapat digunakan sebagai sumber data peta dengan atribusi yang benar.
- Nominatim dapat dipakai untuk geocoding/reverse geocoding, tetapi server publiknya memiliki usage policy dan tidak boleh dipakai sembarangan untuk traffic besar.
- OSRM adalah routing engine open-source yang dapat berjalan di atas data OpenStreetMap.

Catatan lokal:
- Penulisan resmi aplikasi harus menggunakan **Sawitto**.
- Alias typo “Sawito” boleh dikenali di input, tetapi tidak boleh menjadi label utama UI, database, laporan, atau export.

---

## 21. Ringkasan untuk Developer

Prioritas implementasi:

1. Tambahkan master kecamatan dan kelurahan.
2. Pastikan semua label menggunakan “Sawitto”.
3. Tambahkan normalisasi input lokasi.
4. Tambahkan field `districtId`, `villageId`, `neighborhoodId`, `pickupZoneId` pada tiket.
5. Tambahkan peta OpenStreetMap di dashboard operator.
6. Tampilkan marker tiket secara realtime.
7. Tambahkan filter kecamatan/kelurahan.
8. Tambahkan halaman admin untuk mengelola lingkungan dan zona.
9. Tambahkan lokasi petugas realtime secara terbatas.
10. Integrasikan aturan wilayah ke prompt Gemini.

Jangan mengubah fokus MVP:
- jangan masuk ke harga per kg,
- jangan masuk e-wallet,
- jangan ekspedisi,
- jangan marketplace,
- jangan tracking driver publik ke pelanggan dulu.

Fokus utama tetap:

> Foto sampah → AI analisa volume → cek wilayah layanan → tiket jemput → jadwal → petugas jemput → status realtime di peta.

---

## 22. Status Implementasi 13 Juni 2026

Selesai:

1. Master dua kecamatan dan 14 kelurahan dibuat sebagai konstanta terstruktur.
2. Normalizer mengenali alias `Sawito` dan selalu menghasilkan id resmi
   `Sawitto`.
3. Schema tiket mendukung `villageId`, `neighborhoodId`, `pickupZoneId`,
   sumber lokasi, akurasi GPS, dan status validasi lokasi secara kompatibel
   dengan tiket lama.
4. Wizard warga menampilkan pilihan kelurahan sesuai kecamatan.
5. Wizard warga dapat mengambil GPS browser serta memilih atau menggeser pin
   pada OpenStreetMap.
6. Dashboard operator memiliki route `/admin/map` untuk marker tiket dan
   `/admin/regions` untuk melihat master wilayah pilot.
7. Daftar tiket operator dapat difilter berdasarkan kelurahan.
8. Detail operator serta daftar dan detail petugas menampilkan kelurahan.
9. Prompt AI mengenali daftar kelurahan dan penulisan resmi Sawitto.
10. Leaflet dimuat secara lazy agar halaman tanpa peta tidak mengunduh bundle
    peta.
11. GPS browser, klik peta, dan pin yang digeser menjalankan reverse geocoding
    untuk menyesuaikan alamat, kecamatan, dan kelurahan secara otomatis.
12. Hasil reverse geocoding disimpan sementara di browser dan dibatasi satu
    permintaan per detik untuk mematuhi batas layanan publik Nominatim.
13. Jika respons OSM hanya memuat kelurahan, kecamatan ditentukan dari master
    wilayah aplikasi. Pengguna tetap dapat mengoreksi semua field secara
    manual.
14. Popup `alert` dan `confirm` bawaan browser telah diganti dialog aplikasi
    yang responsif dan konsisten dengan tema.
15. Polygon lokal untuk seluruh 14 kelurahan layanan telah tersedia dari
    dataset batas desa/kelurahan BIG edisi 28 September 2023.
16. Kecamatan dan kelurahan sekarang ditentukan dengan pemeriksaan koordinat
    terhadap polygon lokal. Nominatim hanya dipakai untuk melengkapi alamat.
17. Batas Watang Sawitto dan Paleteang ditampilkan sebagai layer pada peta.
18. Formulir tidak lagi memakai Watang Sawitto sebagai nilai awal. Wilayah
    tetap kosong sampai terdeteksi polygon atau dipilih manual.

Belum dibuka:

1. Penyuntingan lingkungan dan zona jemput ke Firestore.
2. Penggantian dataset 2023 jika batas definitif atau versi BIG terbaru telah
   tersedia.
3. Posisi petugas realtime dan layer `driverLocations`.
4. Routing OSRM internal. Tombol maps eksternal tetap menjadi jalur MVP.
5. Proxy reverse geocoding internal untuk trafik produksi menengah atau besar.

Catatan operasional:

- Tile `tile.openstreetmap.org` hanya sesuai untuk pengembangan dan penggunaan
  MVP bertrafik rendah sesuai kebijakan penyedia.
- Sebelum trafik produksi meningkat, gunakan provider tile khusus atau
  infrastruktur tile sendiri.
- Atribusi OpenStreetMap wajib tetap terlihat.
- Endpoint reverse geocoding dapat diarahkan ke server Nominatim sendiri atau
  provider lain melalui `VITE_NOMINATIM_URL`.
