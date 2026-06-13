# 05 — API dan Backend Specification

## 1. Tujuan Backend

Backend bertugas sebagai pusat integrasi antara WhatsApp, Gemini AI, database, dashboard operator, dan PWA petugas.

Backend harus:

- menerima webhook WhatsApp,
- menyimpan pesan masuk,
- mengunduh media foto,
- memanggil Gemini,
- membuat tiket pickup,
- mengirim balasan WhatsApp,
- menyediakan API untuk dashboard dan PWA petugas.

## 2. Endpoint WhatsApp Webhook Verification

```http
GET /api/webhooks/whatsapp
```

Fungsi:

- Verifikasi webhook WhatsApp Cloud API.
- Cocokkan verify token dari query dengan `WHATSAPP_VERIFY_TOKEN`.

Response berhasil:

```http
200 OK
<challenge>
```

## 2.1 Health Checks

```http
GET /health/live
GET /health/ready
```

- Liveness memeriksa proses aplikasi tanpa dependency eksternal.
- Readiness memeriksa konfigurasi produksi dan koneksi Firestore.
- Readiness gagal mengembalikan `503`.
- Kedua response memakai `Cache-Control: no-store`.
- Nilai secret tidak boleh muncul pada response atau log.

## 3. Endpoint WhatsApp Message Receiver

```http
POST /api/webhooks/whatsapp
```

Fungsi:

1. Terima payload WhatsApp.
2. Simpan raw payload ke `whatsappMessages`.
3. Deteksi tipe pesan.
4. Jika image, download media.
5. Simpan image ke Storage.
6. Jalankan AI analysis pipeline.
7. Buat/update customer.
8. Buat/update ticket.
9. Kirim balasan WhatsApp.

Kontrol keamanan minimum:

- body maksimal sesuai `WHATSAPP_WEBHOOK_MAX_BODY_BYTES`,
- signature HMAC diverifikasi sebelum parsing,
- rate limit menghasilkan `429` dan header `Retry-After`,
- log tidak boleh memuat raw body, signature, token, atau nomor WhatsApp,
- response error internal harus generik.

## 4. Endpoint Analyze Message

```http
POST /api/ai/analyze-message
```

Body:

```json
{
  "customerPhoneNumber": "628xxxx",
  "text": "mau jemput sampah, ini fotonya",
  "imageUrls": ["https://..."],
  "location": {
    "lat": -3.793,
    "lng": 119.652
  }
}
```

Response:

```json
{
  "analysis": {
    "intent": "PICKUP_REQUEST",
    "detectedDistrict": "PALETEANG",
    "volumeLevel": "LARGE",
    "tricycleLoadEstimate": "THREE_QUARTERS",
    "recommendedServiceType": "ONE_TRIP_TRICYCLE",
    "needsOperatorReview": true,
    "customerReply": "Siap, permintaan sudah kami terima.",
    "operatorSummary": "Volume terlihat besar, kemungkinan cukup 1 kali jalan."
  }
}
```

Catatan:

- Endpoint ini internal-only.
- Gunakan `INTERNAL_API_SECRET`.
- Jangan expose langsung ke publik.

## 5. Endpoint Create Pickup Request

```http
POST /api/pickup-requests
```

Body:

```json
{
  "customerPhoneNumber": "628xxxx",
  "district": "PALETEANG",
  "addressText": "Dekat Masjid ...",
  "location": {
    "lat": -3.79,
    "lng": 119.65
  },
  "serviceType": "ONE_TRIP_TRICYCLE",
  "volumeLevel": "LARGE",
  "tricycleLoadEstimate": "THREE_QUARTERS",
  "photoUrls": [],
  "aiAnalysis": {}
}
```

## 6. Endpoint List Tickets

```http
GET /api/pickup-requests
```

Query params:

- `status`
- `district`
- `serviceType`
- `date`
- `q`

Contoh:

```http
GET /api/pickup-requests?district=PALETEANG&status=NEEDS_OPERATOR_REVIEW
```

## 7. Endpoint Get Ticket Detail

```http
GET /api/pickup-requests/:id
```

Response harus memuat:

- data tiket,
- data customer,
- foto sampah,
- riwayat pesan WhatsApp terkait,
- hasil analisa AI,
- jadwal,
- petugas.

## 8. Endpoint Update Ticket Status

```http
PATCH /api/pickup-requests/:id/status
```

Body:

```json
{
  "status": "SCHEDULED",
  "operatorNotes": "Masuk jadwal Paleteang Rabu pagi"
}
```

## 9. Endpoint Assign Driver

```http
PATCH /api/pickup-requests/:id/assign-driver
```

Body:

```json
{
  "driverId": "driver_001",
  "scheduledDate": "2026-06-20",
  "scheduledTimeWindow": {
    "start": "09:00",
    "end": "12:00"
  }
}
```

## 10. Endpoint Complete Pickup

```http
POST /api/pickup-requests/:id/complete
```

Body:

```json
{
  "actualTripResult": "COMPLETED_ONE_TRIP",
  "beforePhotoUrls": [],
  "afterPhotoUrls": [],
  "driverNotes": "Selesai 1 kali jalan"
}
```

## 11. Endpoint Driver Pickups Today

```http
GET /api/driver/pickups/today
```

Fungsi:

- Mengambil daftar pickup untuk petugas login.
- Filter berdasarkan `assignedDriverId` dan tanggal hari ini.

## 12. Endpoint Reports

```http
GET /api/reports/summary
```

Query params:

- `startDate`
- `endDate`
- `district`

Response:

```json
{
  "totalTickets": 100,
  "completed": 80,
  "cancelled": 5,
  "extraTripRequired": 3,
  "byDistrict": {
    "WATANG_SAWITTO": 55,
    "PALETEANG": 45
  },
  "byVolumeLevel": {
    "SMALL": 20,
    "MEDIUM": 40,
    "LARGE": 35,
    "OVERSIZED": 5
  }
}
```

## 13. Error Handling

Gunakan response standar:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data tidak lengkap"
  }
}
```

Kode error:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `AI_PARSE_FAILED`
- `WHATSAPP_SEND_FAILED`
- `MEDIA_DOWNLOAD_FAILED`
- `INTERNAL_ERROR`

## 14. Background Jobs

MVP bisa menggunakan Cloud Functions scheduled jobs untuk:

1. Reminder tiket belum dijadwalkan.
2. Reminder pickup hari ini.
3. Rekap laporan harian.
4. Cleanup media lama jika diperlukan.

## 15. Audit Log

Simpan aktivitas penting:

- tiket dibuat,
- status diubah,
- jadwal dibuat,
- petugas ditugaskan,
- pickup selesai,
- extra trip ditandai,
- tiket ditolak/dibatalkan.

Koleksi opsional:

```ts
interface AuditLog {
  id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: 'PICKUP_REQUEST' | 'SCHEDULE' | 'USER' | 'AI_ANALYSIS';
  entityId: string;
  before?: any;
  after?: any;
  createdAt: Timestamp;
}
```
