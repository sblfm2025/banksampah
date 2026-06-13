import { Link, useParams } from 'react-router-dom';
import { DISTRICT_LABELS } from '../../shared/constants/districts';
import { SERVICE_TYPE_LABELS } from '../../shared/constants/services';
import {
  AppHeader,
  Card,
  DistrictBadge,
  EmptyState,
  StatusBadge,
  VolumeBadge,
} from '../ui/components';
import { getPublicTicket } from './public-data';
import { getVillage } from '../../shared/regions/service-areas';

export function PublicTicketDetailPage() {
  const { id } = useParams();
  const ticket = id ? getPublicTicket(id) : undefined;
  if (!ticket) {
    return (
      <>
        <AppHeader title="Detail Tiket" />
        <main className="app-container py-7">
          <EmptyState
            description="Tiket tidak ditemukan pada perangkat ini."
            title="Tiket tidak tersedia"
          />
        </main>
      </>
    );
  }
  return (
    <>
      <AppHeader
        back={
          <Link className="text-xl text-[#087f8c]" to="/tickets">
            ←
          </Link>
        }
        subtitle={ticket.code}
        title="Detail Tiket"
      />
      <main className="app-container space-y-5 py-7">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400">
                Nomor tiket
              </p>
              <h2 className="mt-1 text-xl font-extrabold">{ticket.code}</h2>
            </div>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <DistrictBadge district={DISTRICT_LABELS[ticket.district]} />
            <VolumeBadge volume={ticket.volume} />
          </div>
        </Card>

        {ticket.photo && (
          <Card className="overflow-hidden">
            <img
              alt="Foto sampah"
              className="aspect-[4/3] w-full object-cover"
              src={ticket.photo}
            />
          </Card>
        )}

        <Card className="p-6">
          <h2 className="font-extrabold">Informasi penjemputan</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <Detail label="Lokasi jemput" value={ticket.address} />
            <Detail
              label="Kelurahan"
              value={getVillage(ticket.villageId)?.name ?? 'Belum dipilih'}
            />
            <Detail
              label="Estimasi volume"
              value={
                {
                  SMALL: 'Sampah kecil',
                  MEDIUM: 'Sampah sedang',
                  LARGE: 'Sampah banyak',
                  OVERSIZED: 'Perlu dicek operator',
                }[ticket.volume]
              }
            />
            <Detail
              label="Jenis layanan"
              value={SERVICE_TYPE_LABELS[ticket.service]}
            />
            <Detail
              label="Jadwal"
              value="Menunggu konfirmasi operator"
            />
            <Detail label="Petugas" value="Belum ditugaskan" />
            <Detail label="Catatan" value={ticket.notes || '-'} />
          </dl>
        </Card>
        {ticket.location && (
          <a
            className="block rounded-2xl border border-[#9bd4dc] bg-[#e6f7fa] p-4 text-center font-bold text-[#087f8c]"
            href={`https://www.openstreetmap.org/?mlat=${ticket.location.lat}&mlon=${ticket.location.lng}#map=18/${ticket.location.lat}/${ticket.location.lng}`}
            rel="noreferrer"
            target="_blank"
          >
            Buka titik jemput di OpenStreetMap
          </a>
        )}
      </main>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <dt className="text-xs font-semibold text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
