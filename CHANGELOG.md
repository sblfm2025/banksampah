# Changelog

## Unreleased

### Security

- Menutup akses Firebase Storage untuk bukti pickup yang disimpan melalui Firestore privat.
- Memperketat rules hasil pickup, foto, catatan lapangan, transisi status, dan audit.
- Menambahkan guard agar production/staging tidak dapat berjalan dengan mode demo.

### Operations

- Menambahkan validasi akun aktif Super Admin, Operator, dan Driver pada production readiness.
- Menambahkan filter server-side dan composite indexes untuk workflow operator.
- Menambahkan reason code masalah lapangan dan eskalasi ke review operator.
- Mewajibkan nama dan nomor WhatsApp pada draft pengajuan web serta memperjelas bahwa draft belum terkirim ke operator.
- Mengganti istilah UI "tiket" menjadi "permintaan jemput" agar lebih mudah dipahami warga.
- Mengubah halaman Profil warga dari menu statis menjadi profil lokal yang dapat diedit dan dipakai ulang pada permintaan berikutnya.
- Mengaktifkan eksekusi test komponen React `*.test.tsx` yang sebelumnya terlewat konfigurasi Vitest.
- Menstabilkan test laporan lintas tanggal dan alur end-to-end.
- Menambahkan audit log kesiapan serta checklist pilot lapangan.
