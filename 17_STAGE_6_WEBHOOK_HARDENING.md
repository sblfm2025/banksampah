# Tahap 6B - Hardening Webhook WhatsApp

Sub-tahap ini memperkuat endpoint publik WhatsApp sebelum aktivasi produksi.

## Kontrol yang Ditambahkan

Urutan pemrosesan webhook POST:

1. Tolak body di atas batas ukuran.
2. Verifikasi HMAC `X-Hub-Signature-256`.
3. Terapkan rate limit.
4. Parse JSON.
5. Jalankan intake pipeline.
6. Catat hasil sebagai structured security event.

Signature invalid tidak menghabiskan kuota rate limit. Detail error internal
tidak dikembalikan kepada pemanggil.

## Respons

- `413 Payload Too Large` untuk body berlebih.
- `401 Invalid Signature` untuk HMAC tidak valid.
- `429 Too Many Requests` dengan header `Retry-After`.
- `400 Invalid JSON` untuk payload rusak.
- `500 Processing Failed` tanpa detail internal.

## Logging Aman

Logger JSON hanya menerima field allowlist:

- event,
- severity,
- timestamp,
- request ID,
- hash source key,
- ukuran body,
- jumlah pesan diproses,
- retry delay,
- nama kelas error.

Raw payload, signature, token, nomor WhatsApp, dan pesan error tidak dicatat.

## Konfigurasi

```env
WHATSAPP_WEBHOOK_RATE_LIMIT=120
WHATSAPP_WEBHOOK_RATE_WINDOW_MS=60000
WHATSAPP_WEBHOOK_MAX_BODY_BYTES=1048576
```

## Batas Deployment

`FixedWindowRateLimiter` bawaan menyimpan counter di memori dan melindungi satu
instance proses. Untuk Cloud Functions/Cloud Run dengan beberapa instance,
adapter HTTP harus menyuntikkan implementasi `RateLimiter` terdistribusi,
misalnya Redis/Memorystore atau gateway-level rate limiting.

## Verifikasi

- Payload terlalu besar ditolak sebelum parsing.
- Signature invalid ditolak sebelum limiter.
- Kuota berlebih menghasilkan `429` dan `Retry-After`.
- Window limiter dapat reset.
- Error intake tidak bocor ke response/log.
- Source key di-hash sebelum ditulis ke log.
