# 03 — Data, Firebase Rules, dan Privasi Warga

Dokumen ini mengarahkan perapian data model, security rules, media, audit log, dan retensi data.

---

## 1. Prinsip data

Data aplikasi harus memenuhi prinsip berikut:

1. Mudah dipakai operator.
2. Aman untuk warga.
3. Bisa dilaporkan per wilayah.
4. Bisa diaudit saat ada perubahan status.
5. Tidak mengunci MVP ke fitur mahal/rumit.
6. Siap dikembangkan ke modul bank sampah penuh setelah workflow jemput stabil.

---

## 2. Standarisasi field wilayah

Jangan hanya menyimpan nama wilayah bebas. Gunakan ID stabil dan nama tampilan.

Tambahkan/standarkan field berikut pada `customers`, `pickupRequests`, dan `pickupSchedules`:

```ts
type DistrictId = 'watang-sawitto' | 'paleteang' | 'out-of-area' | 'unknown';

interface RegionFields {
  districtId: DistrictId;
  districtName: 'Watang Sawitto' | 'Paleteang' | 'Luar Wilayah' | 'Belum Diketahui';

  villageId?: string;
  villageName?: string;

  environmentId?: string;
  environmentName?: string;

  location?: {
    lat: number;
    lng: number;
    accuracyMeters?: number;
    source?: 'WHATSAPP_LOCATION' | 'GPS_BROWSER' | 'MANUAL_OPERATOR' | 'ADDRESS_ONLY';
  };
}
```

Backward compatibility:

- Jangan langsung hapus field lama `district` dan `village` jika sudah dipakai data lama.
- Buat normalizer:

```ts
export function normalizeRegion(input: {
  district?: string;
  districtId?: string;
  village?: string;
  villageId?: string;
}) {
  // Terima data lama dan baru.
  // Output selalu districtId, districtName, villageId, villageName.
}
```

---

## 3. Status tiket dan state machine

Status tiket harus tetap mengikuti alur aman:

```text
NEW
  -> NEEDS_INFO
  -> NEEDS_OPERATOR_REVIEW
  -> CONFIRMED
  -> SCHEDULED
  -> ASSIGNED
  -> IN_PROGRESS
  -> COMPLETED
```

Cabang khusus:

```text
IN_PROGRESS -> EXTRA_TRIP_REQUIRED
ASSIGNED / IN_PROGRESS -> CANCELLED
NEW / NEEDS_INFO / NEEDS_OPERATOR_REVIEW / CONFIRMED -> REJECTED
```

Larangan:

- `NEW` tidak boleh langsung `COMPLETED`.
- `COMPLETED` tidak boleh diedit driver.
- `REJECTED` tidak boleh dibuka ulang tanpa flow administratif khusus.
- `CANCELLED` tidak boleh tiba-tiba menjadi `COMPLETED`.

Implementasi harus memakai satu sumber fungsi:

```ts
export function assertValidPickupTransition(from: PickupStatus, to: PickupStatus) {
  // throw jika transisi ilegal
}
```

Fungsi ini harus dipakai di:

- service backend,
- repository Firestore langsung,
- test,
- mapping aksi UI.

---

## 4. Audit log wajib

Setiap perubahan status atau data operasional penting harus menulis audit log.

Minimal action:

```ts
type AuditAction =
  | 'PICKUP_STATUS_CHANGED'
  | 'PICKUP_SCHEDULED'
  | 'PICKUP_DRIVER_ASSIGNED'
  | 'PICKUP_STARTED'
  | 'PICKUP_RESULT_RECORDED'
  | 'PICKUP_REJECTED'
  | 'PICKUP_CANCELLED'
  | 'PICKUP_EXTRA_TRIP_REQUIRED';
```

Audit log harus menyimpan:

```ts
interface AuditLog {
  actorId: string;
  actorRole: 'SUPER_ADMIN' | 'OPERATOR' | 'DRIVER';
  action: AuditAction;
  entityType: 'PICKUP_REQUEST';
  entityId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  createdAt: Timestamp;
}
```

Rules harus memvalidasi:

- actor sesuai auth user,
- role sesuai profil user,
- status sebelum/sesudah cocok,
- audit dibuat dalam batch yang sama,
- tiket menyimpan `lastAuditId` yang sesuai.

---

## 5. Strategi media bukti pickup

Pilih salah satu strategi resmi. Jangan campur tanpa kontrol.

### Opsi A — Firestore compressed media untuk paket Spark

Gunakan koleksi:

```text
pickupProofMedia/{mediaId}
```

Field:

```ts
interface PickupProofMedia {
  pickupRequestId: string;
  driverId: string;
  kind: 'before' | 'after';
  contentType: 'image/jpeg';
  byteSize: number;
  width?: number;
  height?: number;
  dataUrl: string;
  sequence: number;
  createdAt: Timestamp;
}
```

Aturan:

- Maksimal 300 KB per foto.
- Maksimal 2 foto before dan 2 foto after.
- Read hanya:
  - `SUPER_ADMIN`,
  - `OPERATOR`,
  - driver pemilik tugas.
- Export laporan tidak membawa dataUrl.

Jika memakai opsi ini, ubah `storage.rules` agar path bukti pickup tidak longgar:

```js
match /pickup-proofs/{allPaths=**} {
  allow read, write: if false;
}
```

### Opsi B — Firebase Storage privat

Jika memakai Storage:

Path:

```text
pickup-proofs/{driverId}/{pickupRequestId}/{kind}-{sequence}.jpg
```

Syarat:

- Upload hanya driver yang ditugaskan.
- Read hanya operator/admin atau driver yang ditugaskan.
- Metadata wajib:
  - `pickupRequestId`,
  - `driverId`,
  - `kind`,
  - `createdBy`.

Catatan penting:

- Jangan pakai rule `allow read: if signedIn();` untuk foto bukti pickup.
- Foto bukti bisa memuat rumah, nomor rumah, orang, halaman, atau barang pribadi warga.

---

## 6. Data sensitif dan retensi

Data sensitif:

- nomor WhatsApp,
- nama warga,
- alamat,
- koordinat,
- foto sampah,
- foto bukti pickup,
- raw payload WhatsApp,
- raw model output AI.

Aturan:

1. Driver tidak boleh melihat raw payload WhatsApp.
2. Driver hanya melihat tiket yang ditugaskan kepadanya.
3. Export CSV laporan operasional tidak boleh menyertakan nomor WhatsApp kecuali export khusus admin.
4. Raw payload hanya untuk audit teknis dan debug terbatas.
5. AI raw output hanya untuk operator/admin.
6. Media harus punya metadata retensi.

Tambahkan field retensi:

```ts
retention?: {
  keepUntil?: Timestamp;
  reason: 'OPERATIONAL' | 'AUDIT' | 'CUSTOMER_SUPPORT';
}
```

Untuk MVP, boleh belum menghapus otomatis, tetapi metadata harus siap.

---

## 7. Firestore indexes

Pastikan index minimal:

```json
[
  {
    "collectionGroup": "pickupRequests",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "status", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "pickupRequests",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "districtId", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "pickupRequests",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "scheduledDate", "order": "ASCENDING" },
      { "fieldPath": "assignedDriverId", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "pickupRequests",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "villageId", "order": "ASCENDING" },
      { "fieldPath": "scheduledDate", "order": "ASCENDING" }
    ]
  }
]
```

Jika masih ada data lama memakai `district`/`village`, buat index transisi atau migrasi ringan.

---

## 8. Query operator jangan hanya ambil 100 lalu filter lokal

Untuk demo, ambil 100 tiket lalu filter di client masih bisa diterima. Untuk pilot lapangan, ini berbahaya karena data relevan bisa tidak tampil.

Perbaikan:

- filter status pakai query Firestore,
- filter tanggal pakai query Firestore,
- filter driver pakai query Firestore,
- filter kecamatan/kelurahan pakai query Firestore,
- search nomor/ticket code boleh pakai query khusus atau search index sederhana.

Pola repository:

```ts
export async function listTickets(params: {
  status?: PickupStatus;
  districtId?: string;
  villageId?: string;
  scheduledDate?: string;
  assignedDriverId?: string;
  limit?: number;
  cursor?: unknown;
}) {
  // susun query berdasarkan parameter yang didukung index
}
```

---

## 9. Acceptance criteria data/security

- [ ] Driver tidak bisa membaca tiket driver lain.
- [ ] Driver tidak bisa membaca raw WhatsApp messages.
- [ ] User login biasa tidak bisa membaca semua foto bukti.
- [ ] Operator bisa melihat bukti pickup untuk tiket operasional.
- [ ] Semua perubahan status punya audit log.
- [ ] Transisi ilegal ditolak service dan rules.
- [ ] Laporan publik/internal tidak membocorkan nomor warga.
- [ ] Field wilayah baru berjalan tanpa merusak data lama.
