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
- Menstabilkan test laporan lintas tanggal dan alur end-to-end.
- Menambahkan audit log kesiapan serta checklist pilot lapangan.
