import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AppIcon,
  AppLogo,
  Card,
  type IconName,
} from '../../ui/components';
import { landingImpactStats } from '../content/impact-content';
import {
  founderProfile,
  organizationProfile,
} from '../content/profile-content';
import {
  featuredPrograms,
  publicServices,
  solutionPillars,
  wasteTypes,
  type ProgramStatus,
} from '../content/program-content';

const quickBenefits = [
  {
    icon: 'camera' as IconName,
    title: 'Foto dulu, baru diverifikasi',
    description:
      'Operator melihat foto sampah sebelum menjadwalkan, sehingga warga tidak perlu menjelaskan berulang.',
  },
  {
    icon: 'pin' as IconName,
    title: 'Alamat dan titik lokasi jelas',
    description:
      'Data kecamatan, kelurahan, alamat, dan koordinat membantu petugas menemukan lokasi jemput.',
  },
  {
    icon: 'clock' as IconName,
    title: 'Status bisa dipantau',
    description:
      'Warga bisa melihat apakah permintaan masih diverifikasi, dijadwalkan, atau sudah selesai.',
  },
];

const howItWorks = [
  {
    number: '01',
    title: 'Lengkapi profil warga',
    description:
      'Masuk dengan Google atau email, lalu lengkapi nama, alamat, nomor WhatsApp, dan titik lokasi.',
  },
  {
    number: '02',
    title: 'Ajukan permintaan jemput',
    description:
      'Unggah foto sampah, pilih lokasi, dan kirim permintaan agar masuk ke dashboard operator.',
  },
  {
    number: '03',
    title: 'Operator mengatur jadwal',
    description:
      'Operator memverifikasi data, menghubungi warga bila perlu, lalu menugaskan petugas.',
  },
  {
    number: '04',
    title: 'Petugas menyelesaikan jemput',
    description:
      'Petugas melihat alamat, kontak, dan foto sampah, kemudian memperbarui status layanan.',
  },
];

const roleLinks = [
  {
    title: 'Warga',
    description: 'Ajukan permintaan jemput dan pantau status layanan.',
    href: '/login?role=citizen',
  },
  {
    title: 'Petugas',
    description: 'Lihat tugas jemput, alamat, kontak, dan foto dari warga.',
    href: '/login?role=driver',
  },
  {
    title: 'Operator',
    description: 'Verifikasi permintaan, atur jadwal, dan tugaskan petugas.',
    href: '/login?role=operator',
  },
];

const impactTiles = [
  {
    title: 'Lingkungan',
    image: '/illustrations/community-impact-pinrang-v2.webp',
    description: 'Pemilahan bersih dan penjemputan yang lebih tertib.',
  },
  {
    title: 'Sosial',
    image: '/illustrations/founder-story-ali-topan-illustration-v2.webp',
    description: 'Gerakan warga, sekolah, relawan, dan pengurus komunitas.',
  },
  {
    title: 'Operasional',
    image: '/illustrations/landing-hero-recycling-bin-v2.webp',
    description: 'Foto, lokasi, jadwal, dan status tercatat dalam satu alur.',
  },
];

const mediaMentions = [
  'Komunitas',
  'Sekolah',
  'UMKM',
  'Pemerintah',
  'Relawan',
  'Warga',
];

const solutionTracks = [
  {
    icon: 'camera' as IconName,
    eyebrow: 'Untuk warga',
    title: 'Ajukan jemput sampah',
    description:
      'Mulai dari foto sampah, alamat, titik lokasi, dan nomor WhatsApp agar operator bisa memverifikasi dengan jelas.',
    href: '/pickup/new',
    cta: 'Mulai ajukan',
  },
  {
    icon: 'phone' as IconName,
    eyebrow: 'Butuh pendampingan',
    title: 'Dibantu lewat WhatsApp',
    description:
      'Cocok untuk warga yang belum terbiasa aplikasi atau ingin bertanya dulu tentang area dan jenis sampah.',
    href: '#bantuan',
    cta: 'Minta bantuan',
  },
  {
    icon: 'chart' as IconName,
    eyebrow: 'Untuk operator',
    title: 'Verifikasi dan atur jadwal',
    description:
      'Permintaan masuk bisa dicek, dilengkapi, dijadwalkan, dan ditugaskan ke petugas lapangan.',
    href: '/login?role=operator',
    cta: 'Masuk operator',
  },
  {
    icon: 'truck' as IconName,
    eyebrow: 'Untuk petugas',
    title: 'Lihat tugas jemput',
    description:
      'Petugas menerima informasi alamat, kontak, foto sampah, dan status tugas dalam satu alur kerja.',
    href: '/login?role=driver',
    cta: 'Masuk petugas',
  },
];

const faqItems = [
  {
    question: 'Apakah warga wajib punya email untuk memakai layanan?',
    answer:
      'Warga bisa masuk dengan Google bila punya email. Jika belum terbiasa memakai email, warga dapat menghubungi operator lewat WhatsApp untuk dibantu membuat atau melengkapi profil layanan.',
  },
  {
    question: 'Mengapa profil harus dilengkapi setelah login Google?',
    answer:
      'Akun Google hanya memberi identitas dasar. Layanan jemput tetap membutuhkan nama lengkap, nomor WhatsApp, alamat jelas, dan titik lokasi agar operator serta petugas tidak salah koordinasi.',
  },
  {
    question: 'Wilayah mana yang sudah dilayani?',
    answer:
      'Tahap awal difokuskan pada Watang Sawitto dan Paleteang. Permintaan di luar area pilot perlu dikonsultasikan dulu agar jadwal dan kapasitas petugas tetap realistis.',
  },
  {
    question: 'Bagaimana kalau alamat dari peta belum tepat?',
    answer:
      'Warga dapat menggeser pin lokasi dan memperbaiki alamat lengkap secara manual. Sistem memakai peta OSM dan batas lokal agar kecamatan serta kelurahan lebih akurat untuk area pilot.',
  },
  {
    question: 'Apakah aplikasi ini sudah menghitung harga atau saldo?',
    answer:
      'Belum. MVP ini fokus pada pencatatan permintaan, verifikasi foto, penjadwalan, penugasan, dan status penjemputan. Fitur transaksi hanya ditampilkan bila sudah benar-benar siap.',
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159fb3]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold leading-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

function LandingCtaLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className: string;
}) {
  if (href.startsWith('#')) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  return (
    <Link className={className} to={href}>
      {children}
    </Link>
  );
}

function getWhatsAppUrl() {
  const phone = import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER as
    | string
    | undefined;
  const message =
    (import.meta.env.VITE_PUBLIC_WHATSAPP_MESSAGE as string | undefined) ??
    'Halo Peduli Pinrang, saya ingin bertanya tentang layanan jemput sampah.';

  if (!phone) {
    return undefined;
  }

  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

function ProgramStatusBadge({ status }: { status: ProgramStatus }) {
  const styles: Record<ProgramStatus, string> = {
    Aktif: 'bg-green-50 text-green-700',
    Pilot: 'bg-cyan-50 text-cyan-700',
    'Berdasarkan permintaan': 'bg-amber-50 text-amber-700',
    'Segera hadir': 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ClaimBadge({ status }: { status: 'verified' | 'needsVerification' }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${
        status === 'verified'
          ? 'bg-green-50 text-green-700'
          : 'bg-amber-50 text-amber-700'
      }`}
    >
      {status === 'verified' ? 'Terverifikasi' : 'Perlu verifikasi berkala'}
    </span>
  );
}

export function LandingBootAnimation() {
  const [shouldShow, setShouldShow] = useState(() => {
    try {
      return sessionStorage.getItem('peduliLandingBootSeen') !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!shouldShow) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem('peduliLandingBootSeen', '1');
      } catch {
        // Session storage can be unavailable in strict private contexts.
      }
      setShouldShow(false);
    }, 1900);

    return () => window.clearTimeout(timer);
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="landing-boot fixed inset-0 z-[80] grid place-items-center bg-white">
      <div className="landing-boot-card mx-6 rounded-[2rem] border border-slate-100 bg-white p-7 text-center shadow-[0_24px_80px_rgb(15_23_42/0.14)]">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.5rem] bg-[#e6f7fa]">
          <AppLogo compact />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#159fb3]">
          Peduli Pinrang
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
          Menyiapkan layanan jemput sampah warga
        </h2>
        <div className="mx-auto mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-slate-100">
          <span className="landing-loader block h-full w-2/3 rounded-full bg-[#159fb3]" />
        </div>
      </div>
    </div>
  );
}

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="app-container flex min-h-14 items-center justify-between gap-4">
        <Link aria-label="Kembali ke beranda" to="/">
          <AppLogo compact />
        </Link>
        <nav className="hidden items-center gap-6 text-xs font-bold text-slate-600 lg:flex">
          <a className="hover:text-[#087f8c]" href="#layanan">
            Layanan
          </a>
          <a className="hover:text-[#087f8c]" href="#program">
            Program
          </a>
          <Link className="hover:text-[#087f8c]" to="/profil">
            Profil
          </Link>
          <a className="hover:text-[#087f8c]" href="#wilayah">
            Wilayah
          </a>
          <a className="hover:text-[#087f8c]" href="#faq">
            FAQ
          </a>
          <a className="hover:text-[#087f8c]" href="#masuk">
            Masuk
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            className="hidden rounded-full border border-[#159fb3] px-4 py-2 text-xs font-bold text-[#087f8c] sm:inline-flex"
            to="/login"
          >
            Masuk
          </Link>
          <Link
            className="rounded-full bg-[#159fb3] px-4 py-2 text-xs font-bold text-white shadow-[0_10px_24px_rgb(21_159_179/0.24)]"
            to="/pickup/new"
          >
            Ajukan Jemput
          </Link>
        </div>
      </div>
    </header>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[520px] overflow-hidden bg-[#0f8f4a] text-white">
      <img
        alt="Bak hijau berisi plastik, kertas, dan kardus daur ulang"
        className="hero-kenburns absolute inset-0 h-full w-full object-cover object-bottom"
        src="/illustrations/landing-hero-recycling-bin-v2.webp"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07843f]/75 via-[#07843f]/35 to-[#064d2b]/15" />
      <div className="relative mx-auto flex min-h-[520px] max-w-4xl flex-col items-center px-6 pt-14 text-center">
        <span className="reveal-up inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold">
          Bank Sampah Peduli Pinrang
        </span>
        <h1 className="reveal-up reveal-delay-1 mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
          Kami Membangun Jaringan Jemput Sampah Warga
        </h1>
        <p className="reveal-up reveal-delay-2 mt-4 max-w-2xl text-sm font-semibold leading-7 text-green-50 sm:text-base">
          Satu alur untuk warga, operator, dan petugas: ajukan permintaan,
          lengkapi lokasi, verifikasi foto, atur jadwal, lalu pantau status.
        </p>
        <div className="reveal-up reveal-delay-3 mt-7 grid gap-3 sm:flex">
          <Link
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-bold text-[#087f8c] shadow-xl"
            to="/pickup/new"
          >
            <AppIcon name="camera" />
            Ajukan Jemput Sampah
          </Link>
          <Link
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/60 px-5 py-4 font-bold text-white"
            to="/profil"
          >
            <AppIcon name="user" />
            Lihat Profil YMPP
          </Link>
        </div>
        <div className="reveal-up reveal-delay-4 mt-10 grid w-full max-w-3xl gap-3 rounded-[2rem] border border-white/20 bg-white/12 p-3 text-left backdrop-blur md:grid-cols-3">
          {[
            ['Pilot', 'Watang Sawitto & Paleteang'],
            ['Alur', 'Foto, lokasi, jadwal, status'],
            ['Bantuan', 'Operator dan WhatsApp'],
          ].map(([label, value]) => (
            <div className="rounded-[1.4rem] bg-white/14 p-4" key={label}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-green-100">
                {label}
              </p>
              <p className="mt-2 text-sm font-extrabold">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SolutionFinderSection() {
  return (
    <section className="app-container relative z-10 -mt-14 pb-8">
      <Card className="reveal-up overflow-hidden p-4 md:p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end">
          <SectionHeading
            description="Pilih jalur yang paling sesuai. Ini dibuat agar halaman depan langsung terasa membantu, bukan hanya memperkenalkan aplikasi."
            eyebrow="Mulai dari kebutuhan"
            title="Mau dibantu sebagai warga, operator, atau petugas?"
          />
          <span className="w-fit rounded-full bg-[#e6f7fa] px-4 py-2 text-xs font-bold text-[#087f8c]">
            Layanan MVP terverifikasi
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {solutionTracks.map((track, index) => (
            <div
              className={`reveal-up reveal-delay-${Math.min(index + 1, 4)} rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_14px_40px_rgb(15_23_42/0.08)]`}
              key={track.title}
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#087f8c] shadow-sm">
                <AppIcon name={track.icon} />
              </span>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#159fb3]">
                {track.eyebrow}
              </p>
              <h3 className="mt-2 font-extrabold text-slate-950">
                {track.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {track.description}
              </p>
              <LandingCtaLink
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#087f8c]"
                href={track.href}
              >
                {track.cta}
                <AppIcon className="h-4 w-4" name="arrow" />
              </LandingCtaLink>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

export function QuickBenefitsSection() {
  return (
    <section className="app-container py-10">
      <div className="grid gap-4 md:grid-cols-3">
        {quickBenefits.map((item) => (
          <Card className="reveal-up p-5" key={item.title}>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e6f7fa] text-[#087f8c]">
              <AppIcon name={item.icon} />
            </span>
            <h3 className="mt-4 font-extrabold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {item.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function FoundationIntroSection() {
  return (
    <section className="app-container py-16">
      <div className="grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
        <div className="reveal-up mx-auto grid h-64 w-64 place-items-center rounded-full bg-[#e6f7fa] text-[#087f8c] md:h-80 md:w-80">
          <AppIcon className="h-32 w-32 md:h-40 md:w-40" name="leaf" />
        </div>
        <div className="reveal-up reveal-delay-1">
          <SectionHeading
            description={organizationProfile.headline}
            eyebrow="Misi Kami"
            title="Menyediakan akses kelola sampah yang lebih mudah bagi warga Pinrang."
          />
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Aplikasi ini menjadi pintu layanan untuk warga, sekaligus alat bantu
            operasional bagi operator dan petugas. Fokus MVP saat ini adalah
            pencatatan permintaan, verifikasi foto, penjadwalan, penugasan, dan
            pemantauan status penjemputan.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 font-bold text-[#087f8c]"
            to="/profil"
          >
            Baca profil lengkap
            <AppIcon className="h-4 w-4" name="arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CommunityFeatureSection() {
  return (
    <section className="app-container py-6">
      <div className="grid items-center overflow-hidden bg-[#e4f5ee] md:grid-cols-[0.95fr_1.05fr]">
        <div className="p-8 md:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c]">
            Dirancang untuk gerakan lokal
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight md:text-3xl">
            Peduli Pinrang menangkap sampah dari sumbernya, dengan ukuran
            kecil sekalipun.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Warga dapat mengirim foto, alamat, dan titik lokasi. Operator
            kemudian menilai data secara manusiawi sebelum menjadwalkan petugas
            sesuai kapasitas layanan.
          </p>
        </div>
        <img
          alt="Komunitas Peduli Pinrang mengelola sampah terpilah"
          className="h-full min-h-72 w-full object-cover"
          loading="lazy"
          src="/illustrations/community-impact-pinrang-v2.webp"
        />
      </div>
    </section>
  );
}

export function ServicesSection() {
  return (
    <section className="app-container py-12" id="layanan">
      <SectionHeading
        description="Layanan dibuat bertahap sesuai kapasitas operasional, agar janji ke warga tetap realistis."
        eyebrow="Layanan utama"
        title="Dari pengajuan warga sampai penjemputan petugas."
      />
      <div className="reveal-up mt-7 grid gap-px overflow-hidden rounded-[1.7rem] border border-slate-200 bg-slate-200 md:grid-cols-3">
        {publicServices.map((service) => (
          <div className="bg-white p-6" key={service.title}>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e6f7fa] text-[#087f8c]">
              <AppIcon name={service.icon} />
            </span>
            <h3 className="mt-4 font-extrabold">{service.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeaturedProgramsSection() {
  return (
    <section className="app-container py-12" id="program">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeading
          description="Program ditampilkan dengan status yang jelas supaya warga memahami mana yang aktif, pilot, atau berdasarkan permintaan."
          eyebrow="Program Peduli Pinrang"
          title="Gerakan lingkungan yang bisa tumbuh bersama warga."
        />
        <Link className="font-bold text-[#087f8c]" to="/profil#program">
          Lihat detail program
        </Link>
      </div>
      <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {featuredPrograms.map((program) => (
          <Card className="flex min-h-52 flex-col rounded-none border-slate-200 p-6 shadow-none" key={program.title}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-extrabold">{program.title}</h3>
              <ProgramStatusBadge status={program.status} />
            </div>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
              {program.description}
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#087f8c]"
              to={program.href}
            >
              Pelajari
              <AppIcon className="h-4 w-4" name="arrow" />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section className="app-container py-10">
      <SectionHeading
        description="Alur ini menjaga warga, operator, dan petugas melihat status yang sama."
        eyebrow="Cara kerja"
        title="Empat langkah dari profil sampai jemput selesai."
      />
      <Card className="reveal-up mt-6 grid gap-0 overflow-hidden px-0 md:grid-cols-4">
        {howItWorks.map((item) => (
          <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r md:last:border-r-0" key={item.number}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-50 text-xs font-extrabold text-green-700">
              {item.number}
            </span>
            <div>
              <h3 className="mt-4 font-bold">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}

export function WasteTypesSection() {
  return (
    <section className="app-container py-10">
      <Card className="reveal-up grid gap-6 overflow-hidden p-6 md:grid-cols-[0.8fr_1.2fr] md:p-8">
        <div>
          <SectionHeading
            description="Jenis sampah berikut membantu warga memahami contoh awal. Operator tetap bisa meminta verifikasi bila foto atau volume belum jelas."
            eyebrow="Jenis sampah"
            title="Utamakan sampah yang bisa dipilah."
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {wasteTypes.map((item) => (
            <span
              className="rounded-full bg-[#e6f7fa] px-4 py-2 text-sm font-bold text-[#087f8c]"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
      </Card>
    </section>
  );
}

export function SolutionsSection() {
  return (
    <section className="app-container py-10">
      <SectionHeading
        description="Aplikasi difokuskan pada kebutuhan operasional yang benar-benar dipakai dulu."
        eyebrow="Solusi MVP"
        title="Sederhana, praktis, dan tidak menjanjikan fitur yang belum aktif."
      />
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {solutionPillars.map((pillar) => (
          <Card className="reveal-up rounded-none border-slate-200 p-6 shadow-none" key={pillar.title}>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-700">
              <AppIcon name="check" />
            </span>
            <h3 className="mt-4 font-extrabold">{pillar.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {pillar.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function ImpactStatsSection() {
  return (
    <section className="app-container py-12">
      <SectionHeading
        description="Dampak ditulis dengan status klaim agar publik memahami mana yang sudah menjadi data layanan dan mana yang masih perlu pembaruan."
        eyebrow="Dampak awal"
        title="Transparan sejak dari halaman depan."
      />
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {landingImpactStats.map((item) => (
          <Card className="reveal-up p-5" key={item.label}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-3xl font-extrabold text-slate-950">
                {item.value}
              </p>
              <ClaimBadge status={item.status} />
            </div>
            <h3 className="mt-4 font-bold">{item.label}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {item.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function ImpactVisualSection() {
  return (
    <section className="app-container py-12">
      <SectionHeading
        eyebrow="Hadir Menciptakan Dampak"
        title="Lingkungan, sosial, dan operasional berjalan bersama."
      />
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {impactTiles.map((tile) => (
          <div className="reveal-up group relative min-h-72 overflow-hidden rounded-[1.8rem]" key={tile.title}>
            <img
              alt={tile.description}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              src={tile.image}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <h3 className="text-xl font-extrabold">{tile.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/80">
                {tile.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FounderStorySection() {
  return (
    <section className="app-container py-12">
      <div className="reveal-up grid items-center overflow-hidden rounded-[2rem] bg-[#e4f5ee] md:grid-cols-[0.9fr_1.1fr]">
        <div className="p-8 md:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c]">
            Penggerak komunitas
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
            {founderProfile.name}
          </h2>
          <p className="mt-2 text-sm font-semibold text-[#087f8c]">
            {founderProfile.role}
          </p>
          <h3 className="mt-8 text-2xl font-extrabold text-slate-950">
            {founderProfile.headline}
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {founderProfile.description}
          </p>
          <p className="mt-4 rounded-2xl bg-white p-4 text-xs leading-6 text-slate-500">
            {founderProfile.privacyNote}
          </p>
        </div>
        <img
          alt="Ilustrasi Ali Topan sebagai penggerak komunitas Peduli Pinrang"
          className="h-full min-h-96 w-full object-cover"
          loading="lazy"
          src="/illustrations/founder-story-ali-topan-illustration-v2.webp"
        />
      </div>
    </section>
  );
}

export function RecognitionSection() {
  return (
    <section className="bg-[#e4f5ee] py-14">
      <div className="app-container">
        <SectionHeading
          eyebrow="Pengakuan"
          title="Dampak gerakan dicatat dengan prinsip kehati-hatian."
          description="Bagian ini menjadi ruang untuk menampilkan penghargaan, publikasi, atau capaian yang sudah diverifikasi oleh pengurus."
        />
        <Card className="reveal-up mt-7 grid items-center gap-6 rounded-[1.8rem] border-0 p-8 shadow-none md:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-sm font-bold text-slate-500">
              Catatan transparansi
            </p>
            <h3 className="mt-4 text-3xl font-extrabold">
              Data layanan dan jejaring diperbarui bertahap.
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Angka yang belum tetap ditulis sebagai estimasi dan diberi label
              verifikasi. Ini menjaga halaman publik tetap menarik tanpa
              melebih-lebihkan klaim.
            </p>
          </div>
          <div className="grid gap-3">
            {landingImpactStats.map((item) => (
              <div className="flex items-center justify-between border-b border-slate-100 py-3" key={item.label}>
                <span className="font-bold">{item.label}</span>
                <span className="text-2xl font-extrabold text-[#087f8c]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

export function MediaMentionSection() {
  return (
    <section className="app-container reveal-up py-14 text-center">
      <p className="text-sm font-extrabold text-slate-950">
        Didukung Ekosistem Lokal
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm font-extrabold text-slate-300">
        {mediaMentions.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

export function ServiceAreaSection() {
  return (
    <section className="app-container py-10" id="wilayah">
      <Card className="reveal-up grid items-center gap-6 overflow-hidden p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
        <div>
          <SectionHeading
            description="Wilayah layanan awal dibatasi agar operator dan petugas bisa menjaga kualitas respons."
            eyebrow="Area layanan"
            title="Pilot di Watang Sawitto dan Paleteang."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            {['Watang Sawitto', 'Paleteang'].map((area) => (
              <span
                className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700"
                key={area}
              >
                {area}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-500">
            Permintaan di luar area pilot sebaiknya dikonsultasikan dulu melalui
            operator agar tidak menimbulkan ekspektasi jadwal yang belum bisa
            dipenuhi.
          </p>
        </div>
        <div className="rounded-[2rem] bg-[#e6f7fa] p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#087f8c]">
            <AppIcon name="pin" />
          </span>
          <h3 className="mt-5 text-xl font-extrabold">
            Peta OSM, batas lokal terverifikasi
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Aplikasi memakai peta OpenStreetMap untuk tampilan, lalu mencocokkan
            koordinat dengan batas layanan lokal agar kecamatan dan kelurahan
            lebih tepat untuk wilayah pilot.
          </p>
        </div>
      </Card>
    </section>
  );
}

export function FAQSection() {
  return (
    <section className="app-container py-12" id="faq">
      <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr]">
        <div className="reveal-up">
          <SectionHeading
            description="Pertanyaan disusun dari kebutuhan paling sering: akses warga, profil, alamat, area pilot, dan batas fitur MVP."
            eyebrow="F.A.Q"
            title="Jawaban singkat sebelum warga mengajukan permintaan."
          />
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#159fb3] px-5 py-4 font-bold text-white shadow-[0_10px_24px_rgb(21_159_179/0.24)]"
            to="/pickup/new"
          >
            Ajukan Jemput
            <AppIcon className="h-4 w-4" name="arrow" />
          </Link>
        </div>
        <div className="grid gap-3">
          {faqItems.map((item, index) => (
            <details
              className={`reveal-up reveal-delay-${Math.min(index + 1, 4)} group rounded-[1.3rem] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgb(15_23_42/0.05)]`}
              key={item.question}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-extrabold text-slate-950">
                {item.question}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e6f7fa] text-[#087f8c] transition group-open:rotate-90">
                  <AppIcon className="h-4 w-4" name="arrow" />
                </span>
              </summary>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RoleLoginSection() {
  return (
    <section className="app-container py-10" id="masuk">
      <SectionHeading
        description="Satu halaman masuk, peran berbeda setelah akun dikenali oleh sistem."
        eyebrow="Akses aplikasi"
        title="Masuk sesuai kebutuhan layanan."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {roleLinks.map((role) => (
          <Card className="reveal-up p-5" key={role.title}>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e6f7fa] text-[#087f8c]">
              <AppIcon name="user" />
            </span>
            <h3 className="mt-4 font-extrabold">{role.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {role.description}
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#087f8c]"
              to={role.href}
            >
              Masuk
              <AppIcon className="h-4 w-4" name="arrow" />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function WhatsAppCTASection() {
  const whatsappUrl = getWhatsAppUrl();

  return (
    <section className="app-container py-16" id="bantuan">
      <div className="reveal-up relative overflow-hidden rounded-[2rem] bg-[#e4f5ee]">
        <div className="grid items-center gap-6 p-8 md:grid-cols-[0.9fr_1.1fr] md:p-12">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#087f8c]">
              <AppIcon name="phone" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c]">
                Butuh bantuan operator?
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Konsultasi program atau permintaan khusus lewat WhatsApp.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Gunakan WhatsApp untuk bertanya tentang sedekah sampah, event,
                unit bank sampah, atau permintaan di luar alur jemput reguler.
              </p>
            </div>
          </div>
          <img
            alt="Komunitas bergabung dalam gerakan Peduli Pinrang"
            className="h-72 w-full rounded-tl-[7rem] object-cover"
            loading="lazy"
            src="/illustrations/community-impact-pinrang-v2.webp"
          />
        </div>
        <div className="px-8 pb-8 md:px-12 md:pb-12">
          {whatsappUrl ? (
            <a
              className="inline-flex justify-center rounded-2xl bg-[#159fb3] px-5 py-4 font-bold text-white shadow-[0_10px_24px_rgb(21_159_179/0.24)]"
              href={whatsappUrl}
              rel="noreferrer"
              target="_blank"
            >
              Hubungi WhatsApp
            </a>
          ) : (
            <p className="rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-500">
              Nomor WhatsApp operator belum dikonfigurasi.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-[#1f2d33] text-white">
      <div className="app-container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <AppLogo compact inverse />
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
            {organizationProfile.transparencyNote}
          </p>
        </div>
        <div>
          <p className="text-sm font-extrabold">Peduli Pinrang</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <Link to="/profil">Tentang Kami</Link>
            <Link to="/profil#program">Program</Link>
            <Link to="/tickets">Cek Permintaan</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-extrabold">Akses</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <Link to="/pickup/new">Ajukan Jemput</Link>
            <Link to="/login">Masuk Akun</Link>
            <a href="#bantuan">Kontak Operator</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
