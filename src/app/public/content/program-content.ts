import type { IconName } from '../../ui/components';

export type ProgramStatus = 'Aktif' | 'Pilot' | 'Berdasarkan permintaan' | 'Segera hadir';

export const publicServices = [
  {
    icon: 'camera' as IconName,
    title: 'Ajukan jemput dari rumah',
    description:
      'Warga mengirim foto sampah, alamat lengkap, dan titik lokasi agar operator bisa memverifikasi permintaan.',
  },
  {
    icon: 'calendar' as IconName,
    title: 'Penjadwalan oleh operator',
    description:
      'Operator meninjau data, menghubungi warga bila perlu, lalu mengatur jadwal dan petugas penjemputan.',
  },
  {
    icon: 'truck' as IconName,
    title: 'Petugas menjemput',
    description:
      'Petugas menerima detail lokasi dan kontak warga, lalu memperbarui status setelah penjemputan selesai.',
  },
];

export const featuredPrograms = [
  {
    title: 'Jemput Sampah Rumah Tangga',
    status: 'Aktif' as ProgramStatus,
    description:
      'Layanan inti untuk membantu warga mengajukan penjemputan sampah terpilah atau sampah bernilai guna.',
    href: '/pickup/new',
  },
  {
    title: 'Sedekah Sampah',
    status: 'Pilot' as ProgramStatus,
    description:
      'Program berbasis kepedulian sosial yang mengajak warga menyumbangkan sampah bernilai untuk kegiatan komunitas.',
    href: '#bantuan',
  },
  {
    title: 'Sampah Tukar Emas',
    status: 'Berdasarkan permintaan' as ProgramStatus,
    description:
      'Kolaborasi edukatif yang dapat diarahkan melalui operator sesuai ketersediaan mitra dan jadwal kegiatan.',
    href: '#bantuan',
  },
  {
    title: 'Event dan Hajatan Bersih',
    status: 'Berdasarkan permintaan' as ProgramStatus,
    description:
      'Pendampingan pengelolaan sampah untuk kegiatan warga, sekolah, komunitas, atau acara lokal.',
    href: '#bantuan',
  },
  {
    title: 'Kompos dan Maggot',
    status: 'Pilot' as ProgramStatus,
    description:
      'Edukasi pengolahan sampah organik yang disiapkan bertahap sesuai kesiapan lokasi dan pendamping.',
    href: '/profil#program',
  },
  {
    title: 'Unit Bank Sampah',
    status: 'Aktif' as ProgramStatus,
    description:
      'Penguatan unit dan komunitas warga agar pemilahan serta pencatatan sampah berjalan lebih tertib.',
    href: '/profil#jejaring',
  },
];

export const wasteTypes = [
  'Botol plastik',
  'Kardus dan kertas',
  'Kaleng dan logam ringan',
  'Minyak jelantah',
  'Sampah organik terpilah',
  'Sampah campuran yang perlu dicek operator',
];

export const solutionPillars = [
  {
    title: 'Mudah untuk warga',
    description:
      'Permintaan cukup dibuat dari ponsel dengan foto, alamat, titik lokasi, dan nomor WhatsApp yang aktif.',
  },
  {
    title: 'Rapi untuk operator',
    description:
      'Data masuk sebagai permintaan yang bisa diverifikasi, dijadwalkan, dan ditugaskan ke petugas.',
  },
  {
    title: 'Jelas untuk petugas',
    description:
      'Petugas melihat alamat, kontak warga, foto sampah, dan status pekerjaan dalam satu tampilan.',
  },
];
