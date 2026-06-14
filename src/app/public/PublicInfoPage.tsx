import { Link } from 'react-router-dom';
import { AppLogo, Card } from '../ui/components';

type PublicInfoPageId =
  | 'services'
  | 'professional'
  | 'programs'
  | 'regions'
  | 'impact'
  | 'partners'
  | 'help';

const pages: Record<
  PublicInfoPageId,
  { eyebrow: string; title: string; description: string; items: string[] }
> = {
  services: {
    eyebrow: 'Layanan',
    title: 'Pilihan layanan sesuai kebutuhan warga dan lingkungan',
    description:
      'Peduli Pinrang menghubungkan penjemputan warga, pemilahan, Bank Sampah, dan mitra pengolahan.',
    items: ['Jemput sampah warga', 'Bank Sampah Peduli Pinrang', 'Edukasi dan pendampingan'],
  },
  professional: {
    eyebrow: 'Layanan profesional',
    title: 'Dukungan kebersihan untuk kegiatan dan organisasi',
    description:
      'Layanan berbayar membantu menjaga operasional yayasan dan membuka peluang kerja tanpa mengaburkan misi sosial.',
    items: ['UMKM, toko, dan kantor', 'Sekolah dan kegiatan edukasi', 'Event, hajatan, dan kebutuhan khusus'],
  },
  programs: {
    eyebrow: 'Program',
    title: 'Gerakan yang tumbuh dari kerja bersama warga',
    description:
      'Program sosial dan edukasi dikembangkan sesuai kebutuhan lapangan serta kapasitas mitra.',
    items: ['Edukasi pemilahan', 'Sedekah sampah', 'Penguatan komunitas dan relawan'],
  },
  regions: {
    eyebrow: 'Wilayah layanan',
    title: 'Pilot layanan di Watang Sawitto dan Paleteang',
    description:
      'Cakupan penjemputan mengikuti kesiapan operator, petugas, rute, dan mitra pengolahan.',
    items: ['Watang Sawitto', 'Paleteang', 'Konfirmasi operator untuk batas wilayah'],
  },
  impact: {
    eyebrow: 'Dampak',
    title: 'Dampak dicatat dari layanan yang benar-benar selesai',
    description:
      'Data berat, jenis layanan, petugas, dan tujuan pengolahan ditampilkan setelah tersedia dan terverifikasi.',
    items: ['Output penjemputan', 'Tujuan material dan mitra', 'Outcome sosial dan operasional'],
  },
  partners: {
    eyebrow: 'Kemitraan',
    title: 'Kolaborasi untuk pengelolaan sampah yang lebih tertata',
    description:
      'Peduli Pinrang terbuka untuk kerja sama TPS3R, sekolah, komunitas, pemerintah, dan program CSR.',
    items: ['TPS3R Paleteang Bersinar', 'Bank Sampah dan komunitas', 'Sekolah, usaha, dan mitra CSR'],
  },
  help: {
    eyebrow: 'Bantuan',
    title: 'Panduan singkat menggunakan layanan',
    description:
      'Ajukan penjemputan melalui aplikasi atau hubungi operator melalui WhatsApp bila membutuhkan bantuan.',
    items: ['Siapkan foto sampah', 'Bagikan alamat dan titik lokasi', 'Tunggu konfirmasi jadwal dari operator'],
  },
};

export function PublicInfoPage({ page }: { page: PublicInfoPageId }) {
  const content = pages[page];
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="app-container flex min-h-20 items-center justify-between gap-4">
          <Link to="/"><AppLogo compact /></Link>
          <Link className="text-sm font-bold text-[#087f8c]" to="/app">
            Pusat Layanan
          </Link>
        </div>
      </header>
      <main className="app-container py-12 sm:py-20">
        <section className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c]">
            {content.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-2xl leading-8 text-slate-600">
            {content.description}
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {content.items.map((item) => (
              <Card className="p-5 shadow-none" key={item}>
                <h2 className="font-extrabold">{item}</h2>
              </Card>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              className="rounded-2xl bg-[#087f8c] px-5 py-3.5 font-bold text-white"
              to="/pickup/new"
            >
              Ajukan Jemput
            </Link>
            <Link
              className="rounded-2xl border border-[#159fb3] bg-white px-5 py-3.5 font-bold text-[#087f8c]"
              to="/"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
