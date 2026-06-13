# Dokumentasi Teknis MVP AI Jemput Sampah Pinrang

Dokumen ini berisi arahan teknis untuk developer VS Code/Codex dalam membangun MVP aplikasi **AI Jemput Sampah Pinrang**.

## Fokus MVP

Aplikasi tahap awal difokuskan pada layanan jemput sampah cerdas untuk dua kecamatan:

1. Watang Sawitto
2. Paleteang

Model layanan tahap awal belum masuk ke detail harga per kilogram. Fokusnya adalah:

- Pengguna cukup mengirim WhatsApp.
- Pengguna bisa mengirim foto sampah.
- AI Gemini 2.5 Flash menganalisa pesan dan foto.
- Sistem memperkirakan volume visual sampah.
- Sistem menentukan apakah cocok untuk penjemputan reguler rumah tangga atau pengangkutan 1 kali jalan motor sampah 3 roda.
- Operator memverifikasi dan menjadwalkan.
- Petugas menjemput dan menyelesaikan tiket.
- Admin melihat laporan operasional.

## Daftar Dokumen

| File | Isi |
|---|---|
| `01_PRODUCT_BRIEF.md` | Konsep produk, tujuan, batasan MVP, model layanan |
| `02_SYSTEM_ARCHITECTURE.md` | Arsitektur sistem, stack teknologi, alur data |
| `03_DATABASE_SCHEMA.md` | Struktur database Firestore dan tipe data utama |
| `04_WHATSAPP_AI_WORKFLOW.md` | Alur WhatsApp, AI Gemini, prompt, guardrail, template balasan |
| `05_API_BACKEND_SPEC.md` | Endpoint backend/API, Cloud Functions, webhook WhatsApp |
| `06_ADMIN_DASHBOARD_SPEC.md` | Spesifikasi dashboard operator/admin |
| `07_DRIVER_PWA_SPEC.md` | Spesifikasi PWA petugas jemput |
| `08_UI_UX_GUIDELINES.md` | Panduan UI/UX dan bahasa aplikasi |
| `09_TESTING_ACCEPTANCE_CRITERIA.md` | Test scenario dan acceptance criteria |
| `10_ROADMAP_NEXT_PHASE.md` | Roadmap pengembangan setelah MVP |
| `11_IMPLEMENTATION_PLAN.md` | Urutan implementasi teknis dan status tahap |
| `12_STAGE_2_IMPLEMENTATION.md` | Hasil Firebase dan backend inti |
| `13_STAGE_3_WHATSAPP_AI.md` | Hasil pipeline WhatsApp dan Gemini |
| `14_STAGE_4_ADMIN_DASHBOARD.md` | Hasil dashboard dan workflow operator |
| `15_STAGE_5_DRIVER_PWA.md` | Hasil PWA dan workflow petugas lapangan |
| `16_STAGE_6_REPORTING.md` | Hasil laporan operasional dan export CSV |
| `17_STAGE_6_WEBHOOK_HARDENING.md` | Rate limiting dan logging aman webhook |
| `18_STAGE_6_SCHEDULED_REMINDER.md` | Job reminder pickup WhatsApp terjadwal |
| `19_STAGE_6_END_TO_END.md` | Acceptance test WhatsApp sampai laporan |
| `20_STAGE_6_OBSERVABILITY.md` | Health checks dan structured operational logs |
| `21_PRODUCTION_FIREBASE_SETUP.md` | Aktivasi IAM, Firebase services, dan deployment |
| `22_AUTH_BOOTSTRAP.md` | Aktivasi Email/Password serta bootstrap akun dan role |

## Prinsip Utama

> Yang pintar adalah sistemnya, bukan pengguna yang dipaksa memahami bahasa teknis sampah.

Pengguna cukup:

1. Chat WhatsApp.
2. Kirim foto sampah.
3. Kirim alamat atau share location.

Sistem yang mengurus analisa, tiket, jadwal, petugas, dan laporan.

## Catatan Penting untuk Developer

Jangan membangun fitur terlalu luas pada MVP. Hindari dulu:

- Harga per kilogram.
- Saldo tabungan sampah.
- Marketplace.
- E-wallet.
- IoT timbangan.
- Aplikasi native Android/iOS.
- Optimasi rute kompleks.

Prioritas utama adalah membuat alur operasional benar-benar berjalan di lapangan.
