# Tahap 3 - Pipeline WhatsApp dan Gemini

Status implementasi lokal: selesai pada 13 Juni 2026.

Aktivasi live belum dilakukan karena kredensial layanan eksternal belum
tersedia:

- `GEMINI_API_KEY`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

## Alur yang Diimplementasikan

```text
Meta webhook raw body
  -> validasi X-Hub-Signature-256
  -> parse payload WhatsApp
  -> simpan pesan secara idempotent
  -> download dan validasi foto
  -> simpan media melalui provider backend yang dikonfigurasi
  -> gabungkan percakapan 30 menit
  -> Gemini 2.5 Flash structured output
  -> validasi semantik Zod
  -> buat atau perbarui tiket
  -> kirim balasan WhatsApp
  -> simpan pesan outbound
```

## Keamanan

- Signature dihitung dari raw request body dengan HMAC SHA-256.
- Signature dibandingkan memakai constant-time comparison.
- JSON tidak diproses sebelum signature valid.
- Media download memakai timeout.
- Foto maksimal 10 MB.
- MIME type dibatasi ke JPEG, PNG, WEBP, HEIC, dan HEIF.
- Token Meta dan Gemini hanya dibaca dari environment backend.
- Graph API default menggunakan `v25.0`.

## Idempotency dan Retry

- `waMessageId` diubah menjadi document ID deterministik.
- Pesan yang sudah `processed=true` tidak diproses ulang.
- Pesan duplikat yang belum selesai tetap dicoba ulang.
- Ticket creation memakai idempotency key dan transaksi Firestore.
- Tiket terbuka dengan status `NEW`, `NEEDS_INFO`, atau
  `NEEDS_OPERATOR_REVIEW` diperbarui saat data susulan masuk.

## AI Guardrail

- Model tidak mengestimasi kilogram.
- Model tidak menetapkan harga atau jadwal final.
- Structured output memakai JSON Schema.
- Output tetap divalidasi Zod untuk aturan bisnis lintas field.
- Raw model output dan source message IDs disimpan untuk audit.
- Jika AI gagal, sistem memakai fallback konservatif.
- Fallback hanya mengenali nama wilayah yang eksplisit dan tetap meminta
  operator review.

## Perintah Verifikasi

```bash
npm run lint
npm test
npm run test:firebase
npm run build
```

## Batas Tahap Ini

- Handler HTTP sudah framework-agnostic, tetapi belum memiliki runtime publik.
  Cloud Functions memerlukan paket berbayar; project Spark tetap menjalankan
  dashboard/driver melalui Firestore langsung.
- Tidak ada panggilan live ke Gemini atau Meta tanpa kredensial.
- Geocoding koordinat ke kecamatan belum ditambahkan; model menggunakan teks
  alamat dan lokasi sebagai konteks.
- Exactly-once delivery untuk balasan eksternal memerlukan outbox worker pada
  tahap hardening. Saat ini database dan ticket creation idempotent, sedangkan
  pengiriman WA mengikuti retry webhook.
