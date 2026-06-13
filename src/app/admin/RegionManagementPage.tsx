import { SERVICE_DISTRICTS, villagesForDistrict } from '../../shared/regions/service-areas';
import { Card } from '../ui/components';

export function RegionManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#159fb3]">
          Wilayah Layanan
        </p>
        <h1 className="mt-2 text-3xl font-bold">Master wilayah pilot</h1>
        <p className="mt-2 text-sm text-slate-500">
          Nama resmi selalu menggunakan “Sawitto”. Alias “Sawito” hanya
          dikenali saat membaca input warga.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {SERVICE_DISTRICTS.map((district) => (
          <Card className="p-6" key={district.id}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold">{district.name}</h2>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                Aktif
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {villagesForDistrict(district.id).length} kelurahan
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {villagesForDistrict(district.id).map((village) => (
                <li
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                  key={village.id}
                >
                  {village.name}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        Pengelolaan lingkungan dan zona jemput belum dibuka untuk penyuntingan.
        Data tersebut harus diverifikasi operator lapangan sebelum disimpan ke
        Firestore.
      </div>
    </div>
  );
}
