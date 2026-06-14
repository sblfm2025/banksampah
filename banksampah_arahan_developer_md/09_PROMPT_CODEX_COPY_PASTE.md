# 09 — Prompt Siap Copy-Paste untuk VS Code / Codex

Gunakan prompt ini satu per satu. Jangan meminta Codex mengerjakan semuanya sekaligus tanpa kontrol, karena berisiko merusak bagian yang sudah baik.

---

## Prompt 1 — Audit awal repo dan catat blocker

```text
Anda bertindak sebagai senior TypeScript/Firebase engineer.

Repo ini adalah aplikasi AI Jemput Sampah / SampahTa’ Pinrang berbasis React, Vite, TypeScript, Firebase, Firestore, Auth, Rules, PWA, dan WhatsApp/AI workflow.

Tugas Anda:
1. Jalankan dan evaluasi command berikut:
   - npm install
   - npm run lint
   - npm run test
   - npm run build
   - npm run check:production
2. Jangan menambah fitur baru dulu.
3. Catat semua error build/lint/test secara ringkas.
4. Buat file docs/PILOT_READINESS_AUDIT_LOG.md berisi:
   - tanggal,
   - branch,
   - commit,
   - hasil command,
   - error utama,
   - rekomendasi perbaikan berurutan.
5. Jangan mengubah logic bisnis sebelum audit selesai.
6. Gunakan bahasa Indonesia pada catatan.
```

---

## Prompt 2 — Stabilkan build dan routing

```text
Lanjutkan dari audit awal.

Fokus hanya pada stabilisasi build dan routing.

Tugas:
1. Periksa src/app/App.tsx dan seluruh import route.
2. Pastikan semua import komponen route punya file yang benar dan named export cocok.
3. Pastikan route publik, admin, dan driver tidak crash.
4. Route yang belum selesai jangan dihapus; buat fallback ComingSoonPage atau sembunyikan menu jika perlu.
5. Pastikan semua route admin dilindungi RoleGuard SUPER_ADMIN/OPERATOR.
6. Pastikan semua route driver dilindungi RoleGuard DRIVER.
7. Pastikan npm run build berhasil.
8. Jangan mengubah desain besar-besaran.
9. Setelah selesai, update docs/PILOT_READINESS_AUDIT_LOG.md dengan perubahan yang dilakukan.
```

---

## Prompt 3 — Kunci demo mode agar aman untuk production

```text
Fokus pada environment dan demo mode.

Masalah yang harus dicegah: production/staging berjalan dengan data demo tanpa disadari.

Tugas:
1. Cari penggunaan VITE_USE_DEMO_DATA dan mode demo di AuthProvider/repository.
2. Pastikan VITE_USE_DEMO_DATA wajib false pada production/staging.
3. Tambahkan guard startup yang melempar error jika production-like environment memakai demo mode.
4. Tambahkan banner merah yang jelas jika demo mode aktif di development/demo.
5. Rapikan .env.example agar membedakan env frontend VITE_* dan secret backend.
6. Pastikan npm run build tetap berhasil.
7. Jangan menampilkan secret ke console/log.
```

---

## Prompt 4 — Perketat media/foto dan privacy rules

```text
Fokus pada privasi foto bukti pickup dan media warga.

Tugas:
1. Audit firestore.rules dan storage.rules.
2. Jangan izinkan semua user login membaca foto bukti pickup.
3. Jika strategi saat ini memakai Firestore compressed media pada pickupProofMedia, set storage.rules path pickup-proofs agar deny all atau sangat ketat.
4. Jika Storage tetap dipakai, batasi read hanya SUPER_ADMIN/OPERATOR atau driver yang ditugaskan, dengan metadata driverId dan pickupRequestId.
5. Tambahkan/rapikan rules test untuk memastikan:
   - anonymous tidak bisa baca data,
   - driver A tidak bisa baca tiket/foto driver B,
   - driver tidak bisa baca raw WhatsApp,
   - operator/admin bisa baca bukti operasional,
   - user login umum tidak bisa baca semua foto.
6. Pastikan npm run test:firebase lulus.
7. Jangan mengubah UX selain yang diperlukan untuk error permission.
```

---

## Prompt 5 — Standarkan wilayah Watang Sawitto dan Paleteang

```text
Fokus pada master wilayah, kelurahan, dan normalisasi penulisan Sawitto.

Tugas:
1. Buat/rapikan master data wilayah di src/shared/constants/regions.ts atau lokasi yang paling sesuai.
2. Pastikan kecamatan aktif hanya:
   - Watang Sawitto
   - Paleteang
3. Penulisan resmi harus “Watang Sawitto”. Input alias “Sawito” boleh dikenali tetapi output UI/database/laporan harus “Sawitto”.
4. Tambahkan field standar jika belum ada:
   - districtId
   - districtName
   - villageId
   - villageName
   - environmentId opsional
   - environmentName opsional
5. Jangan merusak data lama yang masih memakai district/village string. Buat normalizer/backward compatibility.
6. Terapkan master wilayah ke filter operator, wizard warga, laporan, dan peta.
7. Tambahkan test normalisasi wilayah.
8. Pastikan npm run build dan npm run test lulus.
```

---

## Prompt 6 — Perbaiki query operator agar tidak hanya filter lokal 100 data

```text
Fokus pada repository/query dashboard operator.

Masalah: filter lokal setelah mengambil maksimal 100 tiket berisiko membuat data relevan tidak tampil saat operasional berjalan.

Tugas:
1. Cari repository operator/ticket list.
2. Ubah listTickets agar mendukung query Firestore berdasarkan parameter:
   - status
   - districtId
   - villageId
   - scheduledDate
   - assignedDriverId
   - createdAt range
3. Tambahkan pagination/cursor jika diperlukan.
4. Update firestore.indexes.json untuk query baru.
5. Search ticket code boleh tetap exact query atau filter lokal pada hasil terbatas, tetapi jangan mengorbankan filter utama.
6. Pastikan UI tetap ringan dan tidak blank saat index belum deploy; tampilkan error yang jelas.
7. Tambahkan test/repository test jika ada pola yang tersedia.
8. Pastikan npm run build lulus.
```

---

## Prompt 7 — Perkuat dashboard operator dan antrean prioritas

```text
Fokus pada UX operator.

Tugas:
1. Tambahkan/rapikan dashboard ringkasan agar operator melihat kondisi dalam 5 detik.
2. Buat antrean prioritas:
   - safety flag
   - tiket pickup hari ini belum assign driver
   - NEEDS_INFO terlalu lama
   - IN_PROGRESS terlalu lama
   - EXTRA_TRIP_REQUIRED
3. Di list tiket, pastikan filter status, kecamatan, kelurahan, tanggal, driver berjalan.
4. Di detail tiket, tampilkan jelas:
   - data warga,
   - foto sampah,
   - AI summary,
   - lokasi,
   - chat terkait,
   - status operasional,
   - bukti pickup,
   - audit ringkas.
5. Penolakan dan pembatalan wajib alasan.
6. Semua aksi penting harus modal konfirmasi.
7. Jangan tampilkan data teknis berlebihan ke operator kecuali dibutuhkan.
8. Pastikan npm run build lulus.
```

---

## Prompt 8 — Perkuat PWA driver untuk kondisi lapangan

```text
Fokus pada PWA driver mobile-first.

Tugas:
1. Pastikan driver hanya melihat pickup miliknya.
2. Jangan gunakan tabel; gunakan card besar.
3. Tambahkan tombol cepat:
   - Buka Maps
   - Chat Warga
   - Mulai Penjemputan
   - Upload Foto
   - Selesai 1 Trip
   - Butuh Extra Trip
   - Warga Tidak Ada
   - Sampah Belum Disiapkan
   - Lokasi Tidak Sesuai
   - Batal di Lokasi
4. Tambahkan reason code untuk hasil lapangan:
   - COMPLETED_ONE_TRIP
   - PARTIAL_PICKUP
   - EXTRA_TRIP_REQUIRED
   - CUSTOMER_NOT_AVAILABLE
   - WASTE_NOT_READY
   - LOCATION_NOT_FOUND
   - ACCESS_BLOCKED
   - HAZARDOUS_WASTE_FOUND
   - CANCELLED_ON_SITE
5. Driver tidak boleh menyelesaikan pickup tanpa bukti foto.
6. Foto wajib dikompresi sebelum upload/simpan.
7. Jika offline/upload gagal, simpan antrean retry dan tampilkan status pending.
8. Pastikan operator bisa melihat hasil lapangan.
9. Pastikan npm run build dan test terkait lulus.
```

---

## Prompt 9 — Perkuat WhatsApp/AI guardrail dan intent warga

```text
Fokus pada WhatsApp/AI workflow.

Tugas:
1. Pastikan AI tidak pernah menjawab harga final, berat kg, saldo, atau jadwal final.
2. Tambahkan/validasi intent:
   - PICKUP_REQUEST
   - REGULAR_SUBSCRIPTION_INQUIRY
   - ASK_PRICE
   - ASK_AREA
   - COMPLAINT
   - CHANGE_SCHEDULE
   - CANCEL_PICKUP
   - CHECK_STATUS
   - THANK_YOU
   - OTHER
3. Voice note/audio harus dibalas minta teks/foto, tidak crash.
4. Data luar wilayah tidak membuat pickupRequest aktif.
5. Conversation window 30 menit harus mencegah tiket ganda saat warga mengirim teks, foto, lalu lokasi terpisah.
6. Idempotency berdasarkan waMessageId wajib.
7. Output AI wajib validasi Zod. Jika invalid, fallback ke operator review.
8. Tambahkan test untuk ASK_PRICE, CANCEL_PICKUP, CHANGE_SCHEDULE, CHECK_STATUS, audio, dan luar wilayah.
9. Pastikan npm run test dan build lulus.
```

---

## Prompt 10 — Siapkan checklist pilot lapangan

```text
Fokus pada kesiapan pilot, bukan fitur baru.

Tugas:
1. Buat docs/PILOT_LAPANGAN_CHECKLIST.md.
2. Isi checklist untuk:
   - akun super admin,
   - akun operator,
   - akun driver,
   - master wilayah,
   - template WhatsApp,
   - jam layanan,
   - SOP extra trip,
   - SOP batal/jadwal ulang,
   - SOP sampah B3/berbahaya,
   - skenario uji warga,
   - skenario uji operator,
   - skenario uji driver,
   - laporan harian pilot.
3. Tambahkan template tabel evaluasi harian pilot.
4. Jangan mengubah source code kecuali perlu menambahkan link dokumen di README.
5. Gunakan bahasa Indonesia yang jelas dan praktis.
```

---

## Prompt 11 — Final hardening sebelum merge

```text
Lakukan final hardening sebelum PR merge.

Tugas:
1. Jalankan:
   - npm run lint
   - npm run test
   - npm run build
   - npm run check:production
   - npm run test:firebase jika tersedia
   - npm run test:e2e jika tersedia
2. Pastikan tidak ada secret di commit.
3. Pastikan demo mode tidak aktif untuk production/staging.
4. Pastikan role guard berjalan.
5. Pastikan storage/firestore rules aman.
6. Pastikan peta dan wilayah memakai Watang Sawitto, bukan Sawito.
7. Pastikan AI tidak menjawab harga/kg/jadwal final.
8. Update docs/PILOT_READINESS_AUDIT_LOG.md dengan hasil akhir.
9. Buat ringkasan PR dalam bahasa Indonesia:
   - apa yang diperbaiki,
   - file utama yang berubah,
   - cara test,
   - risiko tersisa,
   - rekomendasi langkah berikutnya.
```
