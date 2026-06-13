# Tahap 6C - Scheduled Pickup Reminder

Sub-tahap ini menambahkan job pengingat WhatsApp untuk pickup yang dijadwalkan
besok dan sudah memiliki petugas.

## Alur Job

1. Hitung tanggal besok dalam zona waktu `Asia/Makassar`.
2. Ambil tiket dengan `scheduledDate` tersebut.
3. Proses hanya status `ASSIGNED` yang memiliki ID dan nama petugas.
4. Klaim ledger reminder melalui transaksi Firestore.
5. Kirim WhatsApp message template yang sudah disetujui Meta.
6. Simpan outbound message, status delivery, dan audit log.

Entry point:

```text
src/server/jobs/pickup-reminder.job.ts
```

## Message Template

Nama default:

```text
pickup_schedule_reminder
```

Body parameters berurutan:

1. Kode tiket.
2. Tanggal pickup.
3. Time window.
4. Nama petugas.

Template harus dibuat dan disetujui pada WhatsApp Manager sebelum deployment.

## Konfigurasi

```env
WHATSAPP_REMINDER_TEMPLATE_NAME=pickup_schedule_reminder
WHATSAPP_REMINDER_TEMPLATE_LANGUAGE=id
```

## Idempotensi dan Retry

Koleksi internal `reminderDeliveries` memakai ID deterministik berdasarkan
tiket, tanggal jadwal, dan nama template.

- `PROCESSING`: job sedang memegang lease lima menit.
- `SENT`: run berikutnya melewati reminder.
- `FAILED`: run berikutnya dapat mencoba ulang.

Ledger mencegah dua worker aktif mengirim tiket yang sama secara bersamaan.
Ada celah kecil duplikasi jika proses mati setelah Meta menerima pesan tetapi
sebelum Firestore ditandai `SENT`.

## Adapter Cloud Scheduler

Pada project Cloud Functions, panggil `runPickupReminderJob()` dari
`onSchedule` dengan konfigurasi:

```text
schedule: 0 17 * * *
timeZone: Asia/Makassar
```

Jadwal pukul 17.00 WITA mengirim pengingat untuk pickup hari berikutnya.

## Verifikasi

- Pengiriman pertama membuat satu ledger, outbound message, dan audit.
- Run kedua melewati reminder yang sudah `SENT`.
- Delivery gagal dapat dicoba ulang dan menaikkan `attempts`.
- Client Firebase tidak dapat membaca atau menulis ledger reminder.
