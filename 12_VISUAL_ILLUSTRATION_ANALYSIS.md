# Analisis Ilustrasi Visual dan Adaptasi

Sumber yang dianalisis:

- `Kelompok 8 - UI Design.pdf`
- 171 halaman UI mobile
- Fokus analisis pada ilustrasi splash, onboarding, empty state, dialog, status,
  dan tutorial

## 1. Temuan Visual

### Bahasa ilustrasi

- Ilustrasi memakai bentuk sederhana, outline tipis, dan figur manusia yang
  ramah.
- Warna aksen mengikuti identitas aplikasi dan ditempatkan pada objek penting.
- Setiap state memakai satu metafora utama, misalnya lokasi, kotak kosong,
  keberhasilan, atau kegagalan.
- Ilustrasi tidak berdiri sendiri. Judul, deskripsi singkat, dan aksi utama
  selalu diletakkan dekat ilustrasi.
- Ruang putih digunakan luas agar ilustrasi tidak bersaing dengan informasi
  operasional.

### Pola penempatan

- Splash memakai ilustrasi lingkungan sebagai latar penuh.
- Empty state memakai ilustrasi kecil yang terpusat.
- Dialog memakai ilustrasi ringkas di atas judul.
- Tutorial memakai alur vertikal bernomor dengan ikon atau gambar per langkah.
- Success state memakai simbol universal seperti tanda centang dan ekspresi
  positif.

### Hal yang tidak diadaptasi

- Elemen poin, uang, pembayaran, ekspedisi, dan hadiah.
- Ilustrasi karakter atau komposisi yang identik dengan Waste4Change.
- Sampah yang terlihat ekstrem, kotor, atau menimbulkan kesan tidak aman.
- Ilustrasi dekoratif pada layar yang sudah padat data operasional.

## 2. Arah Adaptasi Jemput Sampah Pinrang

- Konteks visual harus menunjukkan permukiman tropis Indonesia dan layanan
  lokal Kabupaten Pinrang.
- Kendaraan operasional utama divisualisasikan sebagai motor sampah roda tiga.
- Figur petugas memakai seragam turquoise dan perlengkapan kerja yang wajar.
- Figur warga ditampilkan inklusif, sopan, dan tidak menjadi stereotip.
- Palet utama: `#159FB3`, `#087F8C`, `#E6F7FA`, dan `#16A34A`.
- Ilustrasi harus tetap dapat dibaca pada layar ponsel berukuran kecil.

## 3. Aset yang Dibuat

### Hero layanan

Path:

`public/illustrations/hero-jemput-sampah-pinrang.webp`

Kegunaan:

- Menjelaskan layanan dalam sekali lihat.
- Menampilkan hubungan warga, petugas, dan kendaraan jemput.
- Dipasang pada hero halaman utama.

### Empty state tiket

Path:

`public/illustrations/empty-ticket.webp`

Kegunaan:

- Menggantikan empty state generik pada daftar tiket warga.
- Mengarahkan warga untuk membuat pengajuan dari ponsel.
- Memiliki latar transparan agar dapat dipakai pada kartu putih atau soft cyan.

### Penjemputan berhasil

Path:

`public/illustrations/pickup-success.webp`

Kegunaan:

- Menjelaskan hasil akhir layanan pada halaman utama.
- Dapat digunakan kembali pada status tiket `COMPLETED`.
- Memiliki latar transparan.

Total ukuran ketiga aset teroptimasi sekitar 250 KB.

## 4. Aturan Penggunaan

- Gunakan ilustrasi hanya jika membantu pengguna memahami state atau hasil.
- Selalu berikan `alt` yang menjelaskan fungsi gambar.
- Gunakan `loading="lazy"` untuk ilustrasi yang berada di bawah fold.
- Jangan menaruh teks penting di dalam bitmap.
- Jangan memakai ilustrasi sebagai pengganti status, label, atau tombol.
- Untuk aset baru, pertahankan outline, palet, proporsi, dan tingkat detail yang
  konsisten dengan tiga aset awal.

## 5. Prompt Produksi

Ketiga aset dibuat menggunakan built-in image generation dengan arahan:

- ilustrasi editorial flat yang orisinal,
- konteks warga dan petugas Indonesia,
- motor sampah roda tiga turquoise,
- permukiman tropis Pinrang,
- tanpa logo, teks, harga, poin, atau elemen ekspedisi,
- tidak menyalin karakter maupun komposisi merek lain.

Untuk dua aset state, generasi awal memakai latar chroma-key magenta yang
kemudian dihapus secara lokal. Hasil akhir divalidasi memiliki kanal alpha dan
disimpan sebagai WebP teroptimasi.
