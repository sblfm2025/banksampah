# 10 — Roadmap Pengembangan Setelah MVP

## 1. Prinsip Roadmap

MVP harus menyelesaikan masalah paling dasar terlebih dahulu:

1. Pengguna bisa membuat permintaan jemput via WhatsApp.
2. AI bisa membantu estimasi volume dari foto.
3. Operator bisa menjadwalkan.
4. Petugas bisa menyelesaikan pickup.
5. Laporan operasional tersedia.

Setelah MVP stabil, baru fitur tambahan dikembangkan.

## 2. Fase 1 — MVP Operasional

Target:

- Pilot Watang Sawitto dan Paleteang.
- WhatsApp bot aktif.
- Dashboard operator aktif.
- PWA petugas aktif.
- AI analisa foto aktif.
- Tiket pickup berjalan.

Fitur:

1. WhatsApp webhook.
2. Gemini 2.5 Flash.
3. Ticketing.
4. Jadwal pickup.
5. PWA petugas.
6. Bukti foto.
7. Laporan pickup.

## 3. Fase 2 — Paket Layanan dan Langganan

Setelah pickup stabil, tambahkan:

1. Paket reguler rumah tangga.
2. Paket 1 kali jalan motor sampah.
3. Paket komunitas/RT.
4. Paket UMKM/kantor/sekolah.
5. Reminder jadwal otomatis.
6. Invoice sederhana.

Catatan:

Harga tetap berbasis paket/trip dulu, belum per kg.

## 4. Fase 3 — Timbang dan Kategori Sampah

Setelah operasi pickup stabil, baru masuk ke detail timbang.

Fitur:

1. Input berat aktual.
2. Kategori material sederhana.
3. Harga per kategori.
4. Nilai transaksi.
5. Riwayat timbang.
6. Stok bank sampah.

Catatan:

AI tetap bisa membantu, tetapi berat final harus dari petugas/timbangan, bukan dari foto.

## 5. Fase 4 — Saldo, Poin, dan Reward

Tambahkan:

1. Saldo tabungan sampah.
2. Poin hijau.
3. Voucher lokal.
4. Sedekah sampah.
5. Penarikan saldo manual.
6. Riwayat transaksi.

Jangan integrasi e-wallet sebelum legal, rekening, dan SOP payout jelas.

## 6. Fase 5 — Modul Organik

Tambahkan pengelolaan organik:

1. Sumber organik rumah tangga/pasar/sekolah.
2. Batch kompos.
3. Batch maggot.
4. POC.
5. Eco-enzyme.
6. Hasil produksi.
7. Penjualan/distribusi hasil.

## 7. Fase 6 — Dashboard Dampak

Tambahkan dashboard untuk:

1. Pemerintah.
2. CSR.
3. Kelurahan/kecamatan.
4. Sekolah/komunitas.

Indikator:

- jumlah pickup,
- volume/trip,
- estimasi sampah dialihkan dari TPA,
- kecamatan aktif,
- pelanggan aktif,
- organik terolah.

## 8. Fase 7 — Marketplace dan Kemitraan

Setelah data dan stok jelas, tambahkan:

1. Marketplace kompos.
2. Produk recycle.
3. Maggot/hasil BSF.
4. Produk mitra lokal.
5. Campaign CSR.
6. Sponsor voucher.

## 9. Fase 8 — Ekspansi Wilayah

Setelah Watang Sawitto dan Paleteang stabil, perluas ke kecamatan lain secara bertahap.

Syarat ekspansi:

1. Armada cukup.
2. Petugas cukup.
3. Jadwal pickup jelas.
4. Operator mampu menangani tiket.
5. Laporan pilot menunjukkan layanan stabil.

## 10. KPI Pilot

Pantau KPI berikut:

| KPI | Target Awal |
|---|---:|
| Tiket masuk per minggu | 30–100 |
| Pickup selesai | >80% dari tiket terjadwal |
| Tiket butuh data | <30% setelah edukasi berjalan |
| Extra trip | Dicatat untuk evaluasi kapasitas |
| Response operator | Semakin cepat semakin baik |
| Komplain pickup | <10% |
| Wilayah aktif | 2 kecamatan |

## 11. Risiko Pengembangan

Risiko utama:

1. WhatsApp overload jika admin kurang.
2. AI salah menilai volume foto.
3. Pengguna tidak mengirim lokasi jelas.
4. Foto buram.
5. Volume aktual berbeda dari foto.
6. Petugas tidak disiplin upload bukti.
7. Sistem terlalu cepat diperluas sebelum SOP stabil.

Mitigasi:

1. Operator tetap verifikasi.
2. AI tidak membuat keputusan final.
3. Gunakan status `NEEDS_OPERATOR_REVIEW`.
4. Wajib bukti foto petugas.
5. Batasi wilayah pilot.
6. Evaluasi mingguan.
