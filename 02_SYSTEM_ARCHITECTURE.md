# 02 — System Architecture

## 1. Gambaran Umum Arsitektur

Aplikasi MVP menggunakan arsitektur sederhana:

```text
WhatsApp User
   ↓
WhatsApp Cloud API / Gateway WA
   ↓
Webhook Backend
   ↓
Gemini 2.5 Flash
   ↓
Firestore Database + Storage
   ↓
Dashboard Operator
   ↓
PWA Petugas
   ↓
Pickup selesai + laporan
```

## 2. Stack Teknologi Rekomendasi

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- PWA support untuk modul petugas

### Backend

Rekomendasi utama MVP:

- Firebase Hosting
- Firebase Auth
- Firestore
- Firebase Storage
- Cloud Functions

Alternatif:

- Node.js + Express/NestJS
- Supabase PostgreSQL
- Supabase Storage
- Vercel/Render/VPS

Untuk MVP cepat, gunakan Firebase.

### AI

- Gemini 2.5 Flash
- Input teks dan gambar
- Output JSON terstruktur
- Validasi dengan Zod

### WhatsApp

- WhatsApp Cloud API resmi bila memungkinkan
- Webhook untuk pesan masuk
- Endpoint untuk kirim pesan keluar
- Media downloader untuk foto

## 3. Modul Sistem

| Modul | Fungsi |
|---|---|
| WhatsApp Webhook | Menerima pesan, foto, lokasi dari pengguna |
| AI Analyzer | Menganalisa teks/foto dan membuat struktur data |
| Ticket Service | Membuat/mengupdate tiket pickup |
| Customer Service | Mengelola data pengguna berbasis nomor WA |
| Operator Dashboard | Verifikasi, jadwal, assign petugas |
| Driver PWA | Daftar pickup, buka maps, upload bukti |
| Report Service | Laporan pickup, trip, status, kecamatan |
| Storage Service | Simpan foto sampah dan bukti pickup |

## 4. Alur Data WhatsApp

1. Pengguna mengirim pesan WA.
2. WhatsApp mengirim payload ke webhook.
3. Backend menyimpan raw payload.
4. Jika ada foto, backend download media.
5. Foto disimpan ke Firebase Storage.
6. Backend memanggil Gemini 2.5 Flash.
7. Gemini menghasilkan JSON analisa.
8. Backend validasi JSON dengan Zod.
9. Backend membuat/mengupdate customer dan pickup ticket.
10. Backend mengirim balasan WA.
11. Operator melihat tiket di dashboard.

## 5. Alur Operator

1. Operator membuka dashboard.
2. Operator melihat tiket baru.
3. Operator melihat ringkasan AI dan foto.
4. Operator memverifikasi kecamatan, volume, jenis layanan.
5. Operator menetapkan jadwal dan petugas.
6. Sistem mengubah status menjadi `SCHEDULED` atau `ASSIGNED`.
7. Petugas melihat tugas di PWA.

## 6. Alur Petugas

1. Petugas login PWA.
2. Petugas melihat pickup hari ini.
3. Petugas membuka maps atau chat WA pengguna.
4. Petugas datang ke lokasi.
5. Petugas upload bukti foto.
6. Petugas menandai hasil:
   - selesai 1 trip,
   - perlu extra trip,
   - pelanggan tidak ada,
   - batal di lokasi.
7. Sistem update laporan.

## 7. Struktur Folder Rekomendasi

```txt
src/
  app/
    admin/
      tickets/
      schedules/
      map/
      drivers/
      reports/
    driver/
      pickups/
    components/
    layouts/
    routes.tsx

  server/
    ai/
      prompts/
        waste-analysis.prompt.ts
      schemas/
        waste-analysis.schema.ts
      gemini.client.ts
      waste-analysis.service.ts

    whatsapp/
      whatsapp.client.ts
      whatsapp.webhook.ts
      templates.ts
      media.service.ts

    firebase/
      admin.ts
      collections.ts

    services/
      customer.service.ts
      pickup-ticket.service.ts
      schedule.service.ts
      driver.service.ts
      report.service.ts

    api/
      webhooks/
      pickup-requests/
      schedules/
      reports/

  shared/
    types/
      pickup.types.ts
      user.types.ts
      ai.types.ts
    constants/
      districts.ts
      statuses.ts
      services.ts
```

## 8. Environment Variables

Buat `.env.example`:

```env
# App
APP_ENV=development
APP_URL=http://localhost:5173
API_URL=http://localhost:3000

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

# WhatsApp Cloud API
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=

# Security
INTERNAL_API_SECRET=
```

## 9. Prinsip Keamanan

- API key tidak boleh masuk frontend.
- Semua webhook harus divalidasi.
- Gunakan role-based access.
- Simpan raw payload untuk audit.
- Batasi akses data nomor telepon.
- Media/foto punya aturan retensi.
- AI output harus divalidasi sebelum masuk database utama.
