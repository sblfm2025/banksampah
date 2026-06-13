# Tahap 2 - Firebase dan Backend Inti

Status: selesai pada 13 Juni 2026.

## Komponen

- Firebase Admin SDK dengan dukungan emulator.
- Konfigurasi Auth, Firestore, Storage, dan Emulator UI.
- Firestore indexes sesuai query MVP.
- Firestore dan Storage security rules.
- Customer service.
- Pickup ticket service.
- Idempotency key.
- Counter ticket code transaksional.
- Snapshot AI analysis.
- Audit log.
- Validasi transisi status.

## Koleksi Internal

Koleksi berikut hanya dapat ditulis backend Admin SDK:

- `whatsappMessages`
- `aiAnalyses`
- `auditLogs`
- `ticketCounters`
- `idempotencyKeys`

## Perintah Lokal

```bash
npm run emulators
npm test
npm run test:firebase
npm run test:all
```

Emulator menggunakan project ID lokal `sampahta-pinrang-local`.

## Keputusan Keamanan

- Driver hanya dapat membaca tiket yang ditugaskan kepadanya.
- Perubahan status tiket dilakukan melalui backend tervalidasi.
- Operator dapat mengelola customer dan tiket, tetapi tidak membaca audit log.
- Hanya super admin dapat membaca audit log.
- Foto sampah pelanggan ditulis backend.
- Driver hanya dapat mengunggah bukti gambar ke folder UID miliknya.
- Upload bukti dibatasi kurang dari 10 MB dan MIME type gambar.

## Catatan Dependency

`npm audit` melaporkan advisory moderat pada `uuid` melalui dependency transitif
Google Cloud Storage di Firebase Admin SDK. Tidak ada temuan high atau critical.
Saran otomatis npm adalah downgrade major Firebase Admin, sehingga tidak
diterapkan. Dependency harus dipantau dan diperbarui saat upstream merilis
rantai dependency yang sudah diperbaiki.
