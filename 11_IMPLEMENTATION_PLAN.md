# Rencana Implementasi MVP SampahTa' Pinrang

Dokumen ini menerjemahkan spesifikasi produk menjadi urutan implementasi yang
dapat diuji. Acceptance criteria pada `09_TESTING_ACCEPTANCE_CRITERIA.md`
menjadi kontrak utama.

## 1. Keputusan Teknis

- Frontend: React, Vite, TypeScript, Tailwind CSS.
- Data fetching: TanStack Query.
- State lokal: Zustand hanya jika state lintas komponen benar-benar diperlukan.
- Validasi data eksternal: Zod.
- Backend target: Firebase Auth, Firestore, Storage, dan Cloud Functions.
- AI: Gemini 2.5 Flash dengan output JSON terstruktur.
- Kanal pelanggan: WhatsApp Cloud API.
- PWA hanya untuk petugas, bukan aplikasi pelanggan.

## 2. Temuan dan Gap Spesifikasi

### 2.1 Status tiket

Daftar status sudah tersedia, tetapi transisi belum didefinisikan. Implementasi
harus memakai state machine agar tiket tidak dapat berubah langsung dari `NEW`
ke `COMPLETED` atau membuka kembali status terminal tanpa proses administratif.

### 2.2 Analisis AI

Dokumen pengujian menyebut koleksi `aiAnalyses`, sedangkan schema awal hanya
menyimpan analisis di dalam tiket. Implementasi backend akan memakai koleksi
`aiAnalyses` sebagai sumber audit dan menyimpan ringkasan/snapshot pada tiket
untuk kebutuhan baca dashboard.

### 2.3 Percakapan WhatsApp

Satu permintaan dapat datang sebagai beberapa pesan terpisah: teks, foto, lalu
lokasi. Backend memerlukan conversation window dan idempotency berdasarkan
`waMessageId` agar satu pesan tidak diproses dua kali.

### 2.4 Tiket luar wilayah

Permintaan luar wilayah tetap boleh disimpan sebagai pesan/customer atau lead,
tetapi tidak boleh menghasilkan `pickupRequest` aktif.

### 2.5 Ticket code

Nomor urut harian tidak aman dibuat dengan membaca jumlah dokumen lalu menambah
satu. Backend harus menggunakan transaksi Firestore pada counter harian.

### 2.6 Waktu dan tanggal

Semua timestamp disimpan sebagai UTC/Timestamp. Tanggal operasional dan query
"hari ini" harus dihitung menggunakan zona waktu `Asia/Makassar`.

### 2.7 Keamanan webhook

Verifikasi GET saja tidak cukup. Receiver POST perlu memverifikasi signature
Meta, menerapkan idempotency, membatasi ukuran media, dan tidak mencatat token
atau isi rahasia ke log.

### 2.8 Retensi media

Durasi retensi foto belum ditentukan. Sampai ada keputusan operasional, sistem
harus menyiapkan metadata retensi tanpa menjalankan penghapusan otomatis.

### 2.9 Dokumen sumber

Sebagian tanda baca pada dokumen lama tampil sebagai mojibake. Ini tidak
mengubah kontrak bisnis, tetapi sebaiknya dinormalisasi terpisah agar diff
implementasi tidak bercampur dengan perubahan dokumentasi massal.

## 3. Tahapan Eksekusi

### Tahap 1 - Fondasi domain

Status: selesai.

- Scaffold React/Vite/TypeScript.
- Konstanta district, service type, dan status.
- Zod schema untuk hasil AI dan pickup request.
- State machine status tiket.
- Prompt AI dan template WhatsApp.
- Unit test kontrak inti.
- Lint dan production build.

### Tahap 2 - Firebase dan backend inti

Status: selesai.

- Konfigurasi Firebase client/admin dan emulator.
- Firestore converters dan collection references.
- Customer service dan ticket service.
- Counter ticket code transaksional.
- Audit log.
- Security rules dan index Firestore.
- Unit/integration test dengan emulator.

Hasil:

- Customer ID deterministik berbasis hash nomor WhatsApp.
- Pembuatan tiket atomik dengan idempotency key.
- Counter nomor tiket harian memakai transaksi Firestore.
- Snapshot analisis AI dan audit log dibuat bersama tiket.
- State transition ilegal ditolak oleh service.
- Firestore rules membatasi admin, operator, dan driver.
- Storage rules membatasi upload bukti ke folder driver.

Definition of done:

- Customer dapat dibuat atau diperbarui berdasarkan nomor WA.
- Tiket valid dapat dibuat secara idempotent.
- Transisi status ilegal ditolak.
- Data role dibatasi oleh security rules.

### Tahap 3 - Pipeline WhatsApp dan AI

Status: selesai untuk implementasi dan pengujian lokal. Project Firebase
produksi sudah aktif; webhook live menunggu kredensial Gemini/WhatsApp dan
runtime backend publik.

- Verifikasi webhook GET dan signature POST.
- Parser payload untuk text, image, dan location.
- Download serta penyimpanan media.
- Conversation aggregation.
- Gemini structured output dan validasi Zod.
- Safe fallback jika AI gagal.
- Pengiriman balasan WA.

Hasil:

- Raw-body signature diverifikasi sebelum JSON diparsing.
- Payload text, image, location, audio, dan document diklasifikasikan.
- Pesan masuk dan keluar disimpan untuk audit.
- Delivery ulang idempotent dan record gagal dapat dicoba ulang.
- Foto dibatasi 10 MB serta MIME type yang didukung Gemini.
- Percakapan 30 menit menggabungkan teks, foto, dan lokasi.
- Gemini memakai structured JSON Schema dan validasi Zod.
- AI failure menghasilkan fallback konservatif dan raw output tercatat.
- Tiket `NEEDS_INFO` diperbarui, bukan digandakan, saat data susulan masuk.
- Permintaan luar wilayah tidak membuat tiket aktif.

Definition of done:

- Skenario WhatsApp pada dokumen acceptance criteria lulus.
- Pesan duplikat tidak membuat tiket ganda.
- Luar wilayah tidak membuat tiket aktif.
- Output AI invalid masuk ke review operator.

### Tahap 4 - Dashboard operator

Status: workflow inti, jadwal agregat, pengelolaan profil petugas, dan laporan
operasional selesai.

- Auth dan role guard.
- Ringkasan operasional.
- List/filter/search tiket.
- Detail tiket, foto, AI summary, dan riwayat chat.
- Konfirmasi, penolakan, penjadwalan, dan assign petugas.

Hasil:

- Firebase Auth observer dan role guard `SUPER_ADMIN`/`OPERATOR`.
- Halaman login Email/Password, logout, dan pengiriman Firebase ID token ke
  endpoint API produksi.
- Provider Firestore langsung untuk workflow dashboard dan driver agar operasi
  internal dapat berjalan pada paket Spark tanpa Cloud Functions.
- Halaman pengelolaan profil petugas berbasis Firebase Auth UID; hanya Super
  Admin dapat menambah, mengaktifkan, atau menonaktifkan profil.
- Halaman jadwal harian WITA dengan ringkasan status dan pengelompokan pickup
  per petugas.
- Preview bukti pickup Firestore pada detail operator dan deduplikasi antrean
  completion offline per tiket.
- Query Firestore hemat kuota: daftar maksimal 100 tiket, jadwal dan tugas
  driver per tanggal, laporan per rentang, serta KPI menggunakan aggregation.
- Mode demo eksplisit untuk evaluasi tanpa project produksi.
- Dashboard ringkasan dan antrean tiket perlu tindakan.
- List tiket dengan search serta filter status, kecamatan, dan volume.
- Detail customer, lokasi, AI summary, safety flags, foto, dan data operasional.
- Konfirmasi dan penolakan dengan alasan wajib.
- Penjadwalan dan assign petugas dengan state transition tervalidasi.
- Repository API produksi dan handler backend framework-agnostic.
- Mutation UI me-refresh cache tiket dan ringkasan.

Definition of done:

- Operator dapat membawa tiket dari `NEW` sampai `ASSIGNED`.
- Semua perubahan penting menghasilkan audit log.
- Driver tidak dapat mengakses route admin.

### Tahap 5 - PWA petugas

Status: workflow inti selesai dan Hosting/Firebase produksi aktif. Aktivasi
login nyata menunggu akun Auth dan profil role petugas.

- Daftar pickup hari ini.
- Detail, Maps, dan WhatsApp customer.
- Mulai penjemputan.
- Upload bukti.
- Selesai, extra trip, dan customer tidak tersedia.
- Cache baca dan antrean upload sederhana.

Hasil:

- Route mobile-first dan role guard khusus `DRIVER`.
- Daftar dan detail hanya menampilkan pickup milik petugas.
- Aksi mulai mencatat status `IN_PROGRESS`, timestamp, dan audit log.
- Bukti foto diunggah ke Firebase Storage dengan path per driver dan tiket.
- Hasil lapangan dipetakan ke status final atau tindak lanjut yang sesuai.
- IndexedDB menyimpan cache baca dan antrean completion saat koneksi gagal.
- Sinkronisasi antrean dijalankan ulang ketika browser kembali online.
- Manifest dan service worker menghasilkan PWA yang dapat dipasang.

Definition of done:

- Driver hanya melihat tugas miliknya.
- Pickup tidak dapat selesai tanpa bukti foto.
- Upload gagal dapat dicoba ulang saat online.

### Tahap 6 - Laporan dan hardening

Status: seluruh implementasi teknis Tahap 6 selesai: laporan, hardening
webhook, scheduled reminder, end-to-end test, health checks, dan structured
logging. Uji lapangan menunggu project, kredensial, template WhatsApp, serta
akun produksi.

Status aktivasi Firebase: Firestore Jakarta, rules, indexes, dan Hosting
`https://peduli-pinrang.web.app` sudah live. Project tetap menggunakan paket
Spark/free. Bukti pickup memakai fallback Firestore dengan kompresi JPEG
maksimal sekitar 300 KB per foto dan dua foto per bagian; Firebase Storage
tetap tidak digunakan. Authentication, user role produksi, backend deployment,
serta kredensial WhatsApp/Gemini belum diaktifkan. Firebase Authentication dan
Email/Password sudah aktif dan Super Admin pertama telah dibuat pada
13 Juni 2026. Akun driver masih diperlukan untuk uji lapangan; prosedur manual
dan script bootstrap tersedia pada `22_AUTH_BOOTSTRAP.md`.

Hardening jalur Firestore langsung:

- Mutasi status, penjadwalan, penugasan, mulai pickup, dan hasil pickup
  menulis audit log dalam batch atomik yang sama.
- Tiket menyimpan `lastAuditId` sebagai penghubung ke audit log terbaru.
- Firestore Rules memvalidasi aktor, role, action, status sebelum/sesudah,
  timestamp, dan keterkaitan audit dengan tiket.
- Update tiket tanpa audit yang cocok ditolak, termasuk update yang field dan
  transisi statusnya terlihat sah.
- `npm run check:production` memeriksa provider, mode demo, project, dan jumlah
  akun Auth tanpa menampilkan secret.
- `npm run bootstrap:user` dapat membuat akun Auth beserta profil role jika
  kredensial admin lokal tersedia.

- Ringkasan harian/mingguan. Selesai.
- Export CSV. Selesai.
- Scheduled reminder. Selesai.
- Logging, monitoring, dan rate limiting. Structured logs, webhook limiter,
  dan health checks selesai; alert policy/dashboard menunggu project produksi.
- End-to-end test alur utama. Selesai.
- Uji lapangan dengan akun operator dan driver.

Hasil laporan:

- Filter periode maksimal 31 hari.
- KPI tiket masuk, terjadwal, selesai, extra trip, batal, dan completion rate.
- Breakdown kecamatan dan jenis layanan.
- Tren harian berdasarkan zona waktu `Asia/Makassar`.
- CSV tanpa nama dan nomor WhatsApp customer.
- Integration test memastikan tiket lama yang selesai dalam periode tetap
  masuk laporan.

Hasil hardening webhook:

- Batas body sebelum HMAC dan parsing.
- HMAC diverifikasi sebelum kuota rate limit digunakan.
- Respons `429` menyertakan `Retry-After`.
- Structured security logging dengan field allowlist dan source hash.
- Error internal tidak bocor ke response atau log.
- Kontrak limiter dapat diganti implementasi terdistribusi saat deployment.

Hasil scheduled reminder:

- Seleksi pickup besok menggunakan zona waktu `Asia/Makassar`.
- Reminder hanya untuk tiket `ASSIGNED` yang memiliki petugas.
- WhatsApp template message dengan parameter tiket, tanggal, waktu, dan petugas.
- Ledger transaksi dengan lease, status delivery, attempts, dan retry.
- Outbound message serta audit log tercatat.
- Entry point job siap dipanggil adapter Cloud Scheduler/Functions.

Hasil end-to-end test:

- Webhook foto/caption diproses menjadi customer dan tiket.
- Operator membawa tiket dari review hingga assigned.
- Driver membawa tiket dari assigned hingga completed dengan bukti.
- Pesan inbound/outbound dan enam audit action utama diverifikasi.
- Laporan harian memuat tiket masuk, terjadwal, selesai, dan completion rate.
- Provider AI, media, dan WhatsApp difake; Firestore dan service domain nyata.

Hasil observability:

- Liveness probe ringan tanpa dependency eksternal.
- Readiness probe memeriksa konfigurasi produksi dan Firestore.
- Response health tidak memuat nilai secret dan tidak boleh di-cache.
- Job reminder menghasilkan structured event started/completed/failed.
- Error job tetap dilempar agar retry scheduler tetap bekerja.
- Unit suite dibatasi maksimal empat worker agar stabil pada CI Windows.

## 4. Penyegaran UI/UX Mobile-First

Status: selesai dan tervalidasi pada build produksi.

- Sistem desain memakai Poppins, warna utama turquoise, kartu membulat, serta
  komponen loading, error, empty state, badge, modal, dan bottom sheet bersama.
- Halaman warga tersedia pada `/`, `/sampahku`, `/tickets`, `/tickets/:id`,
  `/profile`, dan wizard empat langkah `/pickup/new`.
- Warga dapat mendaftar atau masuk dengan Google. Akun baru wajib melengkapi
  nama, nomor WhatsApp, alamat, serta titik peta terverifikasi sebelum membuat
  permintaan; profil disimpan sebagai role `CUSTOMER` milik UID tersebut.
- Pengajuan warga dari web dikirim sebagai dokumen resmi `pickupRequests`
  setelah login Google dan profil lengkap. Jika koneksi gagal, data disimpan
  sebagai antrean lokal dengan label "Menunggu dikirim" dan dapat dicoba ulang.
- Dashboard operator, login, dan PWA petugas telah diselaraskan dengan identitas
  visual baru tanpa mengubah kontrak Firebase maupun aturan bisnis.
- Logo memakai nama aset stabil
  `public/logo-yayasan-masyarakat-peduli-pinrang.png`.

## 5. Wilayah Layanan dan Peta OpenStreetMap

Status: fondasi wilayah, input GPS warga, master kelurahan, filter operator,
dan peta tiket selesai.

- Master 14 kelurahan untuk Watang Sawitto dan Paleteang.
- Normalisasi alias `Sawito` ke penulisan resmi `Sawitto`.
- Metadata lokasi baru bersifat opsional agar tiket Firestore lama tetap valid.
- Wizard warga menyimpan kelurahan, koordinat, akurasi, dan sumber lokasi.
- Operator dapat melihat tiket berkoordinat pada `/admin/map`.
- Master wilayah read-only tersedia pada `/admin/regions`.
- Lingkungan, zona, boundary GeoJSON, dan posisi petugas realtime menunggu data
  lapangan serta aturan akses Firestore khusus.

## 6. Aturan Scope MVP

Implementasi fase ini tidak boleh menambahkan:

- estimasi berat kilogram dari foto,
- harga final,
- saldo atau reward,
- marketplace,
- e-wallet,
- optimasi rute kompleks,
- ekspansi wilayah di luar dua kecamatan pilot.

## 7. Implementasi Arah Produk V3

Status: fondasi data, laporan, halaman publik, dan kendali operator selesai.

- Permintaan memiliki klasifikasi kategori dan model layanan, status
  pembayaran, biaya manual, kualitas data, tag dampak, serta tujuan mitra.
- Operator dapat memperbarui klasifikasi sosial/profesional dan data ekonomi
  dari halaman detail permintaan; perubahan dicatat pada audit log.
- Petugas dapat mencatat berat akhir dan tujuan material saat menyelesaikan
  penjemputan, termasuk pada antrean offline.
- Dashboard dan CSV memisahkan layanan sosial/profesional, pendapatan tercatat,
  biaya operasional, berat sampah, status pembayaran, dan mitra tujuan.
- Halaman publik menjelaskan layanan warga, layanan profesional, jejaring
  Bank Sampah/TPS3R, dampak terukur, dan jalur WhatsApp-first.
- Operator dapat membuat permintaan manual dari WhatsApp. Warga cukup
  memberikan nama, nomor WA, alamat, kelurahan, serta lokasi bila tersedia;
  data masuk sebagai `NEEDS_OPERATOR_REVIEW`.
- `serviceFee` adalah nilai penawaran manual per permintaan, bukan harga publik.
  MVP tidak memiliki payment gateway, saldo, maupun tarif otomatis.
