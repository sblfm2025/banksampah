export type PublicClaimStatus = 'verified' | 'needsVerification';

export const organizationProfile = {
  brandName: 'Peduli Pinrang',
  foundationName: 'Yayasan Masyarakat Peduli Pinrang',
  bankName: 'Bank Sampah Peduli Pinrang',
  location: 'Kabupaten Pinrang, Sulawesi Selatan',
  serviceArea: 'Watang Sawitto dan Paleteang',
  headline:
    'Gerakan warga untuk membuat layanan jemput sampah lebih tertib, mudah diakses, dan dekat dengan kebutuhan lingkungan Pinrang.',
  description:
    'Peduli Pinrang menghubungkan warga, operator, dan petugas lapangan agar permintaan jemput sampah bisa dicatat, diverifikasi, dijadwalkan, dan dipantau dengan lebih jelas.',
  transparencyNote:
    'Informasi profil dan dampak disajikan secara hati-hati. Angka jaringan dan partisipasi yang masih berubah ditandai sebagai estimasi yang perlu verifikasi berkala.',
};

export const founderProfile = {
  name: 'Ali Topan',
  role: 'Penggerak komunitas dan pendiri Bank Sampah Peduli Pinrang',
  headline: 'Digerakkan oleh kepedulian, kerja lapangan, dan edukasi warga.',
  description:
    'Gerakan ini dirintis bersama pengurus, relawan, dan warga yang percaya bahwa pengelolaan sampah perlu dibuat lebih praktis. Fokusnya bukan hanya mengangkut sampah, tetapi membangun kebiasaan memilah, mencatat, dan mengelola sampah sebagai tanggung jawab bersama.',
  privacyNote:
    'Profil pendiri ditulis singkat dan menghormati privasi pribadi. Halaman publik tidak menampilkan detail keluarga atau cerita pribadi yang tidak diperlukan untuk layanan.',
};

export const profileTimeline = [
  {
    year: 'Awal gerakan',
    title: 'Edukasi dan pengumpulan sampah berbasis warga',
    description:
      'Kegiatan dimulai dari pendekatan komunitas: mengajak warga melihat sampah sebagai persoalan lingkungan yang bisa dikelola bersama.',
    status: 'needsVerification' as const,
  },
  {
    year: 'Penguatan komunitas',
    title: 'Bank Sampah Peduli Pinrang berkembang sebagai simpul layanan',
    description:
      'Pengurus dan relawan mulai menata alur penerimaan sampah, edukasi, dan koordinasi dengan warga serta mitra lokal.',
    status: 'needsVerification' as const,
  },
  {
    year: 'Digitalisasi layanan',
    title: 'Aplikasi jemput sampah mulai dipakai untuk operasional',
    description:
      'Permintaan warga, lokasi jemput, foto sampah, dan penugasan petugas dicatat dalam satu alur digital yang lebih mudah dipantau.',
    status: 'verified' as const,
  },
];

export const stakeholderGroups = [
  {
    title: 'Warga dan rumah tangga',
    description:
      'Mengirim permintaan jemput, melengkapi alamat, dan membantu proses verifikasi dengan foto sampah yang jelas.',
  },
  {
    title: 'Operator dan petugas lapangan',
    description:
      'Memeriksa permintaan, mengatur jadwal, menghubungi warga, dan menyelesaikan penjemputan sesuai wilayah layanan.',
  },
  {
    title: 'Komunitas, sekolah, dan mitra',
    description:
      'Mendukung edukasi, kegiatan sedekah sampah, event bersih, dan penguatan unit bank sampah di lingkungan masing-masing.',
  },
];
