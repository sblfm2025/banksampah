# Arahan Teknis Upgrade Aplikasi Bank Sampah / SampahTa’ Pinrang

Repositori target: `https://github.com/sblfm2025/banksampah`

Dokumen ini adalah paket arahan teknis untuk developer yang bekerja menggunakan **VS Code / Codex**. Tujuannya bukan membuat ulang aplikasi dari nol, tetapi **menstabilkan, merapikan, dan menyiapkan aplikasi agar layak diuji lapangan** sebagai layanan jemput sampah berbasis WhatsApp, operator, dan PWA petugas.

---

## Prinsip utama pekerjaan

1. **Jangan ubah scope MVP menjadi terlalu luas.**
   - Jangan tambahkan harga per kg.
   - Jangan tambahkan saldo tabungan.
   - Jangan tambahkan e-wallet.
   - Jangan tambahkan marketplace.
   - Jangan mengeklaim berat sampah dari foto.
   - Jangan menjanjikan jadwal final sebelum operator konfirmasi.

2. **Pertahankan filosofi aplikasi:**
   > Yang pintar adalah sistemnya, bukan warga yang dipaksa memahami bahasa teknis sampah.

3. **Prioritaskan kestabilan operasional lapangan.**
   Aplikasi harus nyaman untuk:
   - ibu rumah tangga,
   - pelaku UMKM,
   - toko/sekolah/kantor,
   - driver/petugas angkut,
   - operator bank sampah.

4. **Wilayah pilot hanya:**
   - Kecamatan **Watang Sawitto**,
   - Kecamatan **Paleteang**.

5. Penulisan yang benar adalah **Sawitto**, bukan Sawito. Jika input pengguna menulis “Sawito”, sistem boleh mengenali sebagai alias, tetapi UI/database/laporan harus tetap memakai **Watang Sawitto**.

---

## Urutan baca dokumen

| Urutan | Dokumen | Fokus |
|---:|---|---|
| 1 | `01_PRIORITAS_EKSEKUSI.md` | Prioritas kerja developer dari blocker sampai pilot |
| 2 | `02_STABILISASI_BUILD_ROUTING_ENV.md` | Build, routing, env, demo mode, script wajib |
| 3 | `03_DATA_FIREBASE_RULES_PRIVACY.md` | Data model, Firestore rules, Storage rules, privasi warga |
| 4 | `04_WILAYAH_PETA_OSM_REALTIME.md` | Kelurahan, lingkungan/zona, OSM, peta operasional |
| 5 | `05_WHATSAPP_AI_WARGA_UX.md` | Alur warga, WhatsApp, AI guardrail, template balasan |
| 6 | `06_OPERATOR_DASHBOARD_WORKFLOW.md` | Dashboard operator, antrean, triase, jadwal, laporan |
| 7 | `07_DRIVER_PWA_LAPANGAN.md` | PWA petugas, tombol lapangan, offline, bukti foto |
| 8 | `08_QA_TESTING_DEPLOYMENT.md` | Testing, emulator, staging, pilot lapangan |
| 9 | `09_PROMPT_CODEX_COPY_PASTE.md` | Prompt siap copy-paste untuk Codex/VS Code |

---

## Definition of Done paket arahan ini

Developer dianggap selesai mengerjakan paket ini jika:

1. `npm install` berhasil.
2. `npm run lint` berhasil.
3. `npm run test` berhasil.
4. `npm run build` berhasil.
5. `npm run check:production` berhasil untuk konfigurasi production/staging.
6. Demo mode tidak aktif pada environment production/staging.
7. Role `SUPER_ADMIN`, `OPERATOR`, dan `DRIVER` berjalan sesuai hak akses.
8. Operator bisa membawa tiket dari `NEW` sampai `ASSIGNED`.
9. Driver bisa membawa tiket dari `ASSIGNED` sampai `COMPLETED` atau `EXTRA_TRIP_REQUIRED`.
10. Bukti foto tidak bisa dibaca sembarang user login.
11. Tiket bisa difilter per status, tanggal, kecamatan, kelurahan, dan driver.
12. Peta operator menampilkan titik pickup aktif berbasis OpenStreetMap.
13. WhatsApp/AI tidak menjanjikan harga, kg, atau jadwal final.
14. Minimal 15 skenario uji lapangan pada dokumen QA lulus.

---

## Aturan kerja untuk developer

- Kerjakan dalam branch baru, contoh:
  ```bash
  git checkout -b fix/pilot-readiness-banksampah
  ```
- Commit kecil dan jelas.
- Jangan melakukan perubahan kosmetik massal yang tidak terkait issue.
- Jangan rename banyak file sekaligus kecuali memang perlu.
- Jangan mengubah kontrak data tanpa migration/backward compatibility.
- Jika menemukan fitur yang belum matang, jangan hapus; stabilkan atau sembunyikan di balik feature flag.
- Semua perubahan penting harus punya catatan di `CHANGELOG.md` atau dokumen ringkas baru.
