import type { PublicClaimStatus } from './profile-content';

export const landingImpactStats = [
  {
    value: '2',
    label: 'Kecamatan pilot',
    description: 'Watang Sawitto dan Paleteang menjadi wilayah layanan awal aplikasi.',
    status: 'verified' as PublicClaimStatus,
  },
  {
    value: '1',
    label: 'Alur digital',
    description: 'Permintaan, foto, titik lokasi, jadwal, dan status dicatat dalam satu sistem.',
    status: 'verified' as PublicClaimStatus,
  },
  {
    value: 'Puluhan',
    label: 'Unit dan komunitas dampingan',
    description: 'Jaringan pendampingan terus diperbarui sesuai data internal pengurus.',
    status: 'needsVerification' as PublicClaimStatus,
  },
  {
    value: 'Ratusan',
    label: 'Warga terlibat',
    description: 'Partisipasi warga bergerak dinamis melalui edukasi, program, dan layanan komunitas.',
    status: 'needsVerification' as PublicClaimStatus,
  },
];

export const impactPrinciples = [
  'Mengutamakan data layanan yang bisa diperiksa ulang.',
  'Tidak menampilkan saldo, harga per kilogram, atau fitur finansial yang belum aktif.',
  'Menggunakan istilah estimasi untuk angka jejaring yang masih perlu pembaruan berkala.',
];
