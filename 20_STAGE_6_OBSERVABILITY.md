# Tahap 6E - Observability dan Health Checks

Sub-tahap ini menambahkan kontrak health check dan structured operational log
yang siap dihubungkan ke adapter HTTP Cloud Run atau Cloud Functions.

## Health Endpoints

Adapter deployment perlu memetakan:

```text
GET /health/live
GET /health/ready
```

`/health/live` hanya memeriksa bahwa proses Node masih dapat merespons. Endpoint
ini tidak memanggil Firestore atau provider eksternal.

`/health/ready` memeriksa:

- konfigurasi produksi wajib,
- koneksi baca ke Firestore.

Respons:

- `200` jika siap menerima traffic,
- `503` jika konfigurasi atau Firestore belum siap,
- header `Cache-Control: no-store`.

Nilai secret tidak pernah dikembalikan. Response hanya memuat nama konfigurasi
yang belum tersedia.

## Structured Operational Log

Log ditulis sebagai JSON agar masuk ke `jsonPayload` Cloud Logging.

Event yang tersedia:

- `pickup_reminder_started`,
- `pickup_reminder_completed`,
- `pickup_reminder_failed`,
- `readiness_checked`.

Field dibatasi pada metadata operasional seperti durasi, jumlah kandidat,
sent/skipped/failed, status readiness, dan nama kelas error. Nomor WhatsApp,
isi pesan, token, dan raw payload tidak dicatat.

## Deployment

Untuk Cloud Run, gunakan `/health/live` sebagai liveness probe dan
`/health/ready` sebagai readiness probe. Startup probe juga dapat diarahkan ke
readiness agar instance baru tidak menerima traffic sebelum Firestore siap.

Alert policy yang disarankan setelah project produksi tersedia:

1. `pickup_reminder_failed` lebih dari nol.
2. Readiness menghasilkan `503` berulang.
3. Webhook `5xx` meningkat.
4. Webhook rate limited meningkat tajam.
5. Completion rate pickup turun di bawah target pilot.

## Verifikasi

- Liveness tidak bergantung pada Firestore.
- Readiness sehat menghasilkan `200`.
- Firestore/config gagal menghasilkan `503`.
- Job reminder mencatat event sukses dan gagal.
- Exception job tetap dilempar agar scheduler dapat melakukan retry.
