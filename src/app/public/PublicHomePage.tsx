import { Link } from 'react-router-dom';
import {
  AppHeader,
  AppIcon,
  Card,
  ServiceCard,
} from '../ui/components';

const tutorial = [
  {
    number: '01',
    title: 'Foto sampah',
    description: 'Ambil foto yang terang agar volume mudah diperiksa.',
  },
  {
    number: '02',
    title: 'Kirim lokasi',
    description: 'Pastikan alamat berada di wilayah layanan kami.',
  },
  {
    number: '03',
    title: 'Petugas jemput',
    description: 'Operator mengatur jadwal dan menugaskan petugas.',
  },
];

export function PublicHomePage() {
  return (
    <>
      <AppHeader
        action={
          <Link
            className="rounded-full bg-[#e6f7fa] px-3 py-2 text-xs font-bold text-[#087f8c]"
            to="/login"
          >
            Masuk Petugas
          </Link>
        }
        subtitle="Watang Sawitto & Paleteang"
        title="Halo, Warga Pinrang"
      />
      <main>
        <section className="brand-grid overflow-hidden text-white">
          <div className="app-container grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                Layanan jemput sampah lokal
              </span>
              <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
                Sampah dijemput, lingkungan lebih sehat.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-7 text-cyan-50 sm:text-base">
                Kirim foto, cek volume otomatis, lalu operator membantu
                menjadwalkan penjemputan.
              </p>
              <div className="mt-7 grid gap-3 sm:flex">
                <Link
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-bold text-[#087f8c] shadow-xl"
                  to="/pickup/new"
                >
                  <AppIcon name="camera" />
                  Kirim Foto Sampah
                </Link>
                <Link
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/60 px-5 py-4 font-bold text-white"
                  to="/tickets"
                >
                  <AppIcon name="ticket" />
                  Cek Permintaan
                </Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-2 shadow-2xl">
              <img
                alt="Petugas Jemput Sampah Pinrang menerima sampah rumah tangga"
                className="aspect-[16/9] w-full rounded-[1.55rem] object-cover"
                src="/illustrations/hero-jemput-sampah-pinrang.webp"
              />
            </div>
          </div>
        </section>

        <div className="app-container space-y-10 py-9">
          <section>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#159fb3]">
                  Pilihan layanan
                </p>
                <h2 className="mt-2 text-xl font-extrabold">
                  Sesuai kebutuhan rumahmu
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ServiceCard
                description="Untuk sampah rumah tangga dengan volume kecil hingga sedang."
                icon="leaf"
                title="Jemput Reguler Rumah Tangga"
              />
              <ServiceCard
                description="Untuk sampah banyak yang membutuhkan motor sampah 3 roda."
                icon="truck"
                title="Angkut 1 Kali Jalan"
              />
            </div>
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
              Cara kerja
            </p>
            <h2 className="mt-2 text-xl font-extrabold">
              Cukup tiga langkah mudah
            </h2>
            <Card className="mt-5 divide-y divide-slate-100 px-5">
              {tutorial.map((item) => (
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

          <Card className="overflow-hidden bg-[#e6f7fa] p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#087f8c]">
                <AppIcon name="phone" />
              </span>
              <div>
                <h2 className="font-extrabold">Lebih nyaman lewat WhatsApp?</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Kirim foto dan alamat. Operator akan membantu prosesnya.
                </p>
              </div>
            </div>
          </Card>

          <Card className="grid items-center gap-5 overflow-hidden p-6 sm:grid-cols-[0.8fr_1.2fr]">
            <img
              alt="Penjemputan sampah selesai dengan aman"
              className="mx-auto h-52 w-auto object-contain"
              loading="lazy"
              src="/illustrations/pickup-success.webp"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
                Layanan tuntas
              </p>
              <h2 className="mt-2 text-xl font-extrabold">
                Warga tenang, lingkungan lebih bersih
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Status permintaan membantu warga mengikuti proses sampai
                petugas menyelesaikan penjemputan.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
