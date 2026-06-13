import { Link } from 'react-router-dom';
import { AppHeader, AppIcon, Card } from '../ui/components';

const rows = [
  ['Nomor WhatsApp', 'Hubungkan saat membuat permintaan'],
  ['Alamat utama', 'Belum diatur'],
  ['Kecamatan', 'Watang Sawitto / Paleteang'],
  ['Bantuan', 'Panduan layanan'],
  ['Syarat & Ketentuan', 'Ketentuan layanan pilot'],
  ['Tentang Aplikasi', "Jemput Sampah Pinrang"],
];

export function PublicProfilePage() {
  return (
    <>
      <AppHeader subtitle="Pengaturan dan bantuan" title="Profil" />
      <main className="app-container space-y-5 py-7">
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#e6f7fa] text-[#087f8c]">
            <AppIcon name="user" />
          </span>
          <div>
            <h2 className="font-extrabold">Warga Pinrang</h2>
            <p className="mt-1 text-sm text-slate-500">
              Data tersimpan lokal di perangkat
            </p>
          </div>
        </Card>
        <Card className="divide-y divide-slate-100 px-5">
          {rows.map(([label, value]) => (
            <div className="flex items-center justify-between gap-4 py-4" key={label}>
              <div>
                <p className="text-sm font-bold">{label}</p>
                <p className="mt-1 text-xs text-slate-500">{value}</p>
              </div>
              <span className="text-slate-300">›</span>
            </div>
          ))}
        </Card>
        <Link
          className="block rounded-2xl border border-[#159fb3] bg-white px-5 py-4 text-center font-bold text-[#087f8c]"
          to="/login"
        >
          Masuk sebagai operator atau petugas
        </Link>
      </main>
    </>
  );
}
