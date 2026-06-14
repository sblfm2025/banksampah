import { Link } from 'react-router-dom';
import { AppIcon, AppLogo, Card } from '../ui/components';

const primaryActions = [
  {
    to: '/pickup/new',
    icon: 'truck' as const,
    title: 'Ajukan Jemput Sampah',
    description: 'Mulai dari foto dan lokasi. Tidak perlu login di awal.',
    className: 'bg-[#087f8c] text-white shadow-[0_18px_40px_rgb(21_159_179/0.28)]',
  },
  {
    to: '/tickets/check',
    icon: 'ticket' as const,
    title: 'Cek Status Permintaan',
    description: 'Lihat draft perangkat atau permintaan yang sudah dikirim.',
    className: 'border border-[#bde7ec] bg-white text-slate-900',
  },
] as const;

export function ActionHubPage() {
  const whatsappUrl = getWhatsAppUrl();

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="app-container flex min-h-20 items-center justify-between gap-4">
          <AppLogo compact />
          <Link
            className="inline-flex min-h-12 items-center text-sm font-bold text-[#087f8c]"
            to="/"
          >
            Website Publik
          </Link>
        </div>
      </header>
      <main className="app-container py-8 sm:py-12">
        <section className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c]">
            Pusat layanan cepat
          </p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Apa yang ingin Anda lakukan?
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            Pilih kebutuhan Anda. Warga dapat langsung mengajukan penjemputan
            tanpa membuat akun terlebih dahulu.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {primaryActions.map((action) => (
              <Link
                className={`rounded-[1.5rem] p-5 transition hover:-translate-y-0.5 ${action.className}`}
                key={action.to}
                to={action.to}
              >
                <AppIcon name={action.icon} />
                <h2 className="mt-5 text-lg font-extrabold">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 opacity-80">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>

          {whatsappUrl ? (
            <a
              className="mt-4 flex min-h-14 items-center justify-between rounded-2xl bg-green-600 px-5 py-4 font-bold text-white"
              href={whatsappUrl}
              rel="noreferrer"
              target="_blank"
            >
              <span className="flex items-center gap-3">
                <AppIcon name="phone" />
                Chat WhatsApp Operator
              </span>
              <span aria-hidden>&rarr;</span>
            </a>
          ) : (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Nomor WhatsApp operator belum dikonfigurasi.
            </p>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className="p-5 shadow-none">
              <h2 className="font-extrabold">Akun dan dashboard</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Masuk untuk melihat riwayat dan memakai data profil tersimpan.
              </p>
              <div className="mt-4 grid gap-3">
                <Link
                  className="rounded-2xl bg-[#e6f7fa] px-4 py-3 text-center font-bold text-[#087f8c]"
                  to="/auth"
                >
                  Masuk atau Daftar
                </Link>
                <Link
                  className="grid min-h-12 place-items-center text-center text-sm font-bold text-slate-500"
                  to="/auth/staff?role=operator"
                >
                  Masuk Petugas / Operator
                </Link>
              </div>
            </Card>

            <Card className="p-5 shadow-none">
              <h2 className="font-extrabold">Layanan profesional</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Untuk UMKM, kantor, sekolah, event, hajatan, dan mitra TPS3R.
              </p>
              <div className="mt-4 grid gap-3">
                <Link
                  className="rounded-2xl border border-[#159fb3] px-4 py-3 text-center font-bold text-[#087f8c]"
                  to="/layanan-profesional"
                >
                  Ajukan Layanan Profesional
                </Link>
                <Link
                  className="grid min-h-12 place-items-center text-center text-sm font-bold text-slate-500"
                  to="/mitra"
                >
                  Kerja Sama TPS3R / Mitra
                </Link>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
}

function getWhatsAppUrl() {
  const phone = import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER as
    | string
    | undefined;
  if (!phone) return undefined;
  const message =
    (import.meta.env.VITE_PUBLIC_WHATSAPP_MESSAGE as string | undefined) ??
    'Halo Peduli Pinrang, saya ingin meminta bantuan layanan jemput sampah.';
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}
