import { Link } from 'react-router-dom';
import { AppHeader, AppIcon, Card } from '../ui/components';
import { impactPrinciples, landingImpactStats } from './content/impact-content';
import {
  founderProfile,
  organizationProfile,
  profileTimeline,
  stakeholderGroups,
} from './content/profile-content';
import { featuredPrograms } from './content/program-content';
import { PublicFooter } from './landing/LandingSections';

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

export function OrganizationProfilePage() {
  return (
    <>
      <AppHeader
        action={
          <Link
            className="rounded-full bg-[#e6f7fa] px-3 py-2 text-xs font-bold text-[#087f8c]"
            to="/pickup/new"
          >
            Ajukan Jemput
          </Link>
        }
        subtitle="Profil YMPP dan Bank Sampah Peduli Pinrang"
        title="Profil Peduli Pinrang"
      />
      <main className="app-container space-y-8 py-8 lg:py-10">
        <Card className="overflow-hidden">
          <div className="brand-grid grid items-center gap-6 p-6 text-white md:grid-cols-[1fr_0.82fr] md:p-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                {organizationProfile.foundationName}
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
                {organizationProfile.headline}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-cyan-50">
                {organizationProfile.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
                  {organizationProfile.bankName}
                </span>
                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
                  {organizationProfile.location}
                </span>
                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
                  Pilot: {organizationProfile.serviceArea}
                </span>
              </div>
            </div>
            <img
              alt="Ilustrasi Ali Topan sebagai penggerak komunitas Peduli Pinrang"
              className="max-h-80 w-full rounded-[1.5rem] object-cover shadow-2xl"
              src="/illustrations/founder-story-ali-topan-illustration-v2.webp"
            />
          </div>
        </Card>

        <section className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
          <Card className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159fb3]">
              Pendiri dan penggerak
            </p>
            <h2 className="mt-3 text-2xl font-extrabold">
              {founderProfile.name}
            </h2>
            <p className="mt-2 text-sm font-bold text-[#087f8c]">
              {founderProfile.role}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {founderProfile.description}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-600">
              Prinsip publikasi
            </p>
            <h2 className="mt-3 text-2xl font-extrabold">
              Transparan tanpa berlebihan.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {organizationProfile.transparencyNote}
            </p>
            <p className="mt-4 rounded-2xl bg-[#e6f7fa] p-4 text-sm leading-6 text-slate-600">
              {founderProfile.privacyNote}
            </p>
          </Card>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159fb3]">
            Perjalanan gerakan
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">
            Bertumbuh dari edukasi menuju layanan digital.
          </h2>
          <Card className="mt-5 divide-y divide-slate-100 px-5">
            {profileTimeline.map((item) => (
              <div
                className="grid gap-4 py-5 md:grid-cols-[10rem_1fr_auto]"
                key={item.title}
              >
                <p className="text-sm font-extrabold text-[#087f8c]">
                  {item.year}
                </p>
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>
                <ClaimBadge status={item.status} />
              </div>
            ))}
          </Card>
        </section>

        <section id="program">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159fb3]">
            Program
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">
            Program aktif dan bertahap.
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredPrograms.map((program) => (
              <Card className="p-5" key={program.title}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  {program.status}
                </p>
                <h3 className="mt-2 font-extrabold">{program.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {program.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159fb3]">
            Dampak dan catatan data
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">
            Klaim publik dibuat bisa diperiksa.
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {landingImpactStats.map((item) => (
              <Card className="p-5" key={item.label}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-3xl font-extrabold">{item.value}</p>
                  <ClaimBadge status={item.status} />
                </div>
                <h3 className="mt-4 font-bold">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
          <Card className="mt-5 p-5">
            <h3 className="font-extrabold">Catatan batas MVP</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {impactPrinciples.map((item) => (
                <li className="flex gap-2" key={item}>
                  <AppIcon
                    className="mt-0.5 h-4 w-4 shrink-0 text-green-700"
                    name="check"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section id="jejaring">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159fb3]">
            Peta pemangku kepentingan
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">
            Kerja layanan melibatkan banyak peran.
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {stakeholderGroups.map((group) => (
              <Card className="p-5" key={group.title}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e6f7fa] text-[#087f8c]">
                  <AppIcon name="user" />
                </span>
                <h3 className="mt-4 font-extrabold">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {group.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <Card className="grid gap-5 bg-[#e6f7fa] p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold">
              Siap menggunakan layanan?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Lengkapi profil warga, lalu ajukan permintaan jemput dengan foto
              dan titik lokasi yang jelas.
            </p>
          </div>
          <Link
            className="inline-flex justify-center rounded-2xl bg-[#159fb3] px-5 py-4 font-bold text-white"
            to="/pickup/new"
          >
            Ajukan Jemput
          </Link>
        </Card>
      </main>
      <PublicFooter />
    </>
  );
}
