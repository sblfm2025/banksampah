import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { OpenStreetMapView } from '../components/map/OpenStreetMapView';
import { PickupMarker } from '../components/map/PickupMarker';
import { ErrorState, LoadingState } from '../ui/components';
import { operatorRepository } from './operator.repository';

export function AdminMapPage() {
  const tickets = useQuery({
    queryKey: ['tickets', 'map'],
    queryFn: () => operatorRepository.listTickets(),
  });
  const mapped = tickets.data?.filter((ticket) => ticket.location) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087f8c]">
          Peta Operasional
        </p>
        <h1 className="mt-2 text-3xl font-bold">Titik jemput aktif</h1>
        <p className="mt-2 text-sm text-slate-500">
          Peta dasar berasal dari OpenStreetMap. Marker menampilkan data
          permintaan aplikasi, bukan kondisi lalu lintas realtime.
        </p>
      </div>

      {tickets.isLoading ? (
        <LoadingState label="Memuat titik jemput..." />
      ) : tickets.isError ? (
        <ErrorState message="Peta permintaan tidak dapat dimuat." />
      ) : (
        <>
          <OpenStreetMapView className="h-[65vh] min-h-[28rem]">
            {mapped.map((ticket) => (
              <PickupMarker
                description={ticket.addressText ?? 'Alamat belum tersedia'}
                key={ticket.id}
                position={[ticket.location!.lat, ticket.location!.lng]}
                status={ticket.status}
                title={ticket.ticketCode}
              />
            ))}
          </OpenStreetMapView>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            {mapped.length} dari {tickets.data?.length ?? 0} permintaan
            memiliki koordinat.{' '}
            <Link className="font-bold text-[#087f8c]" to="/admin/tickets">
              Buka daftar permintaan
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
