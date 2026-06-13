# Tahap 6A - Laporan Operasional

Bagian pertama Tahap 6 menutup acceptance criterion laporan harian dan
menyediakan laporan mingguan/rentang tanggal untuk operator.

## Cakupan Selesai

- Halaman `/admin/reports`.
- Periode laporan inklusif maksimal 31 hari.
- Total tiket masuk, terjadwal, selesai, extra trip, dan batal/ditolak.
- Completion rate berdasarkan tiket yang dijadwalkan pada periode.
- Breakdown tiket masuk per kecamatan dan jenis layanan.
- Tren harian.
- Export CSV.
- Agregasi tanggal menggunakan zona waktu `Asia/Makassar`.

## Privasi Export

CSV hanya memuat data operasional:

- kode tiket,
- tanggal masuk/jadwal/selesai,
- kecamatan,
- jenis layanan,
- status,
- nama petugas.

Nama dan nomor WhatsApp customer tidak ikut diekspor.

## Backend

`ReportService.getOperationalReport()` mengambil union tiket yang:

- dibuat dalam periode,
- dijadwalkan dalam periode,
- diselesaikan dalam periode,
- diperbarui dalam periode.

Pendekatan ini mempertahankan tiket lama yang baru selesai atau memerlukan
extra trip pada periode laporan.

## Verifikasi

- Unit test agregasi laporan.
- Unit test CSV dan minimisasi PII.
- UI test halaman laporan.
- Integration test Firestore untuk tiket dibuat, dijadwalkan, dan selesai.
- Lint dan production build.

## Sisa Tahap 6

- Scheduled reminder.
- Logging dan monitoring terstruktur.
- Rate limiting endpoint publik.
- End-to-end test lintas WhatsApp, operator, dan driver.
- Uji lapangan dengan akun produksi.
