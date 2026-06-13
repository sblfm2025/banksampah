import { Link } from 'react-router-dom';
import {
  AppIcon,
  AppLogo,
  Card,
  ServiceCard,
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

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="app-container flex min-h-20 items-center justify-between gap-4">
        <Link aria-label="Kembali ke beranda" to="/">
          <AppLogo compact />
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-bold text-slate-600 lg:flex">
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
          <a className="hover:text-[#087f8c]" href="#masuk">
            Masuk
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            className="hidden rounded-full border border-[#159fb3] px-4 py-2 text-sm font-bold text-[#087f8c] sm:inline-flex"
            to="/login"
          >
            Masuk
          </Link>
          <Link
            className="rounded-full bg-[#159fb3] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgb(21_159_179/0.24)]"
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
    <section className="brand-grid overflow-hidden text-white">
      <div className="app-container grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold">
            Layanan jemput sampah komunitas Pinrang
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-6xl">
            Sampah dijemput, warga terbantu, lingkungan lebih tertata.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-cyan-50 sm:text-base">
            {organizationProfile.description}
          </p>
          <div className="mt-8 grid gap-3 sm:flex">
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
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {landingImpactStats.slice(0, 3).map((item) => (
              <div
                className="rounded-2xl border border-white/15 bg-white/10 p-4"
                key={item.label}
              >
                <p className="text-2xl font-extrabold">{item.value}</p>
                <p className="mt-1 text-xs font-semibold text-cyan-50">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-2 shadow-2xl">
          <img
            alt="Petugas Jemput Sampah Pinrang menerima sampah rumah tangga"
            className="aspect-[16/10] w-full rounded-[1.55rem] object-cover"
            src="/illustrations/hero-jemput-sampah-pinrang.webp"
          />
        </div>
      </div>
    </section>
  );
}

export function QuickBenefitsSection() {
  return (
    <section className="app-container py-10">
      <div className="grid gap-4 md:grid-cols-3">
        {quickBenefits.map((item) => (
          <Card className="p-5" key={item.title}>
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
    <section className="app-container py-8">
      <Card className="grid items-center gap-6 overflow-hidden p-6 md:grid-cols-[0.85fr_1.15fr] md:p-8">
        <div className="rounded-[2rem] bg-[#e6f7fa] p-6">
          <AppLogo />
          <div className="mt-8 space-y-3 text-sm font-semibold text-slate-600">
            <p>{organizationProfile.foundationName}</p>
            <p>{organizationProfile.bankName}</p>
            <p>{organizationProfile.location}</p>
          </div>
        </div>
        <div>
          <SectionHeading
            description={organizationProfile.headline}
            eyebrow="Profil gerakan"
            title="Teknologi sederhana untuk kerja komunitas yang lebih rapi."
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
      </Card>
    </section>
  );
}

export function ServicesSection() {
  return (
    <section className="app-container py-10" id="layanan">
      <SectionHeading
        description="Layanan dibuat bertahap sesuai kapasitas operasional, agar janji ke warga tetap realistis."
        eyebrow="Layanan utama"
        title="Dari pengajuan warga sampai penjemputan petugas."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {publicServices.map((service) => (
          <ServiceCard
            description={service.description}
            icon={service.icon}
            key={service.title}
            title={service.title}
          />
        ))}
      </div>
    </section>
  );
}

export function FeaturedProgramsSection() {
  return (
    <section className="app-container py-10" id="program">
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
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featuredPrograms.map((program) => (
          <Card className="flex flex-col p-5" key={program.title}>
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
      <Card className="mt-6 divide-y divide-slate-100 px-5">
        {howItWorks.map((item) => (
          <div className="flex gap-4 py-5" key={item.number}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-50 text-xs font-extrabold text-green-700">
              {item.number}
            </span>
            <div>
              <h3 className="font-bold">{item.title}</h3>
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
      <Card className="grid gap-6 overflow-hidden p-6 md:grid-cols-[0.8fr_1.2fr] md:p-8">
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
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {solutionPillars.map((pillar) => (
          <Card className="p-5" key={pillar.title}>
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
    <section className="app-container py-10">
      <SectionHeading
        description="Dampak ditulis dengan status klaim agar publik memahami mana yang sudah menjadi data layanan dan mana yang masih perlu pembaruan."
        eyebrow="Dampak awal"
        title="Transparan sejak dari halaman depan."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {landingImpactStats.map((item) => (
          <Card className="p-5" key={item.label}>
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

export function FounderStorySection() {
  return (
    <section className="app-container py-10">
      <Card className="grid gap-6 overflow-hidden bg-[#0b6f3a] p-6 text-white md:grid-cols-[0.8fr_1.2fr] md:p-8">
        <div className="rounded-[2rem] bg-white/10 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
            Penggerak komunitas
          </p>
          <h2 className="mt-3 text-3xl font-extrabold">
            {founderProfile.name}
          </h2>
          <p className="mt-2 text-sm font-semibold text-cyan-50">
            {founderProfile.role}
          </p>
        </div>
        <div>
          <h3 className="text-2xl font-extrabold">
            {founderProfile.headline}
          </h3>
          <p className="mt-4 text-sm leading-7 text-green-50">
            {founderProfile.description}
          </p>
          <p className="mt-4 rounded-2xl bg-white/10 p-4 text-xs leading-6 text-green-50">
            {founderProfile.privacyNote}
          </p>
        </div>
      </Card>
    </section>
  );
}

export function ServiceAreaSection() {
  return (
    <section className="app-container py-10" id="wilayah">
      <Card className="grid items-center gap-6 overflow-hidden p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
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
          <Card className="p-5" key={role.title}>
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
    <section className="app-container py-10" id="bantuan">
      <Card className="overflow-hidden bg-[#e6f7fa] p-6 md:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
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
      </Card>
    </section>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="app-container grid gap-6 py-8 md:grid-cols-[1fr_auto]">
        <div>
          <AppLogo compact />
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
            {organizationProfile.transparencyNote}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-600">
          <Link to="/profil">Profil YMPP</Link>
          <Link to="/tickets">Cek Permintaan</Link>
          <Link to="/pickup/new">Ajukan Jemput</Link>
        </div>
      </div>
    </footer>
  );
}
