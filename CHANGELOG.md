# Changelog

## Unreleased

### Security

- Menutup akses Firebase Storage untuk bukti pickup yang disimpan melalui Firestore privat.
- Memperketat rules hasil pickup, foto, catatan lapangan, transisi status, dan audit.
- Menambahkan guard agar production/staging tidak dapat berjalan dengan mode demo.

### Operations

- Memisahkan website publik `/` dari pusat aksi cepat `/app` dan menambahkan
  route publik layanan, program, wilayah, dampak, mitra, serta bantuan.
- Membuka wizard `/pickup/new` untuk tamu tanpa login di awal; draft tamu
  disimpan di perangkat dan diarahkan ke WhatsApp secara jujur.
- Menambahkan route utama `/auth` dan pintu staff `/auth/staff` sambil
  mempertahankan kompatibilitas route `/login`.
- Menyederhanakan auth menjadi satu input email/WhatsApp, menambahkan
  pendaftaran warga berbasis email, onboarding profil, dan redirect dashboard
  otomatis berdasarkan role.
- Mengubah wizard warga menjadi enam langkah dengan foto/deskripsi di awal,
  data penghubung di akhir, autosave draft, kompresi foto, dan konfirmasi
  status pengiriman yang jujur.
- Menambahkan cek status draft menggunakan kode dan nomor WhatsApp, dashboard
  warga terproteksi, animasi publik berbasis viewport, accordion aksesibel,
  floating WhatsApp, dan lazy loading homepage.
- Memperbaiki lebar `.app-container` untuk mencegah risiko horizontal overflow
  pada viewport mobile.
- Mengubah start URL PWA ke `/app`, memecah route admin/driver menjadi lazy
  chunks, dan merapikan import parser Firestore.
- Menambahkan opsi bootstrap untuk menulis UID pilot langsung ke `.env.local`
  serta pesan readiness per-role yang lebih spesifik.
- Mengganti script emulator/deploy agar memakai `npx firebase-tools` dan tidak
  bergantung pada Firebase CLI global.
- Menambahkan production readiness gate pada deploy Hosting/production agar
  frontend pilot tidak bisa terdeploy saat akun Operator/Driver belum lengkap.
- Menambahkan runbook provisioning akun pilot Operator/Driver dan menyelaraskan
  dokumentasi auth ke route utama `/auth`.
- Menambahkan halaman operator untuk membuat permintaan manual dari percakapan
  WhatsApp tanpa mewajibkan warga memiliki akun aplikasi.
- Permintaan manual menyimpan identitas, alamat, koordinat opsional, klasifikasi
  layanan, biaya manual, dan tag dampak lalu masuk ke tahap verifikasi.
- Menyelaraskan Firestore Rules untuk field V3 pada pengajuan warga, klasifikasi
  operator, serta berat dan tujuan pengolahan yang dicatat petugas.
- Menambahkan klasifikasi layanan sosial/profesional, model layanan, biaya
  manual, pembayaran, kualitas data, berat sampah, tag dampak, dan tujuan mitra
  pada detail permintaan operator.
- Menambahkan audit `PICKUP_IMPACT_UPDATED` untuk setiap perubahan data dampak
  oleh operator.
- Menambahkan pencatatan berat akhir dan tujuan pengolahan oleh petugas,
  dashboard output/outcome, serta kolom dampak pada ekspor CSV.
- Menambahkan CTA WhatsApp langsung pada hero dan penjelasan layanan
  profesional serta jejaring Bank Sampah/TPS3R pada halaman publik.
- Menambahkan validasi akun aktif Super Admin, Operator, dan Driver pada production readiness.
- Menambahkan filter server-side dan composite indexes untuk workflow operator.
- Menambahkan reason code masalah lapangan dan eskalasi ke review operator.
- Mewajibkan nama dan nomor WhatsApp pada draft pengajuan web serta memperjelas bahwa draft belum terkirim ke operator.
- Mengganti istilah UI "tiket" menjadi "permintaan jemput" agar lebih mudah dipahami warga.
- Mengubah halaman Profil warga dari menu statis menjadi profil lokal yang dapat diedit dan dipakai ulang pada permintaan berikutnya.
- Mengaktifkan eksekusi test komponen React `*.test.tsx` yang sebelumnya terlewat konfigurasi Vitest.
- Menstabilkan test laporan lintas tanggal dan alur end-to-end.
- Menambahkan audit log kesiapan serta checklist pilot lapangan.
