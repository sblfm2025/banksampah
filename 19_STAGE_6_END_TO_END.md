# Tahap 6D - End-to-End Alur Utama

Sub-tahap ini menambahkan acceptance test lintas modul untuk alur operasional
utama MVP.

## Skenario

1. Customer mengirim foto dan caption melalui webhook WhatsApp.
2. Pesan inbound disimpan.
3. Media diproses dan AI menghasilkan analisis terstruktur.
4. Customer dan tiket dibuat.
5. Balasan WhatsApp outbound disimpan.
6. Operator mengonfirmasi tiket.
7. Operator menjadwalkan dan menugaskan petugas.
8. Petugas memulai pickup.
9. Petugas mengunggah referensi bukti dan menyelesaikan pickup.
10. Laporan harian menampilkan satu tiket masuk, terjadwal, dan selesai.

## Komponen Nyata

- Parser dan intake orchestration.
- `WhatsAppMessageService`.
- `CustomerService`.
- `PickupTicketService`.
- `DriverPickupService`.
- `ReportService`.
- Firestore transaction, converters, audit log, proof, dan query laporan.

## Test Double

Provider eksternal berikut memakai fake deterministik:

- download/upload media,
- Gemini API,
- WhatsApp send API.

Test ini tidak membutuhkan internet atau kredensial produksi, tetapi tetap
menguji kontrak antara pipeline WhatsApp, operator, driver, dan laporan.

## Menjalankan

```bash
npm run test:e2e
```

Suite regresi Firebase lengkap tetap dijalankan dengan:

```bash
npm run test:firebase
```

## Assertion Utama

- Tiket dan customer dibuat satu kali.
- Inbound dan outbound WhatsApp tersimpan.
- Status akhir `COMPLETED`.
- Bukti pickup tersimpan.
- Enam audit action utama tersedia.
- Completion rate laporan bernilai 100 persen.
