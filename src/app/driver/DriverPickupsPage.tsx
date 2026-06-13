import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DISTRICT_LABELS } from '../../shared/constants/districts';
import { getVillage } from '../../shared/regions/service-areas';
import { useAuth } from '../auth/auth-context';
import { StatusBadge } from '../admin/StatusBadge';
import { cacheToday, getCachedToday } from './driver-offline';
import { driverRepository } from './driver.repository';
import { AppDialog } from '../ui/components';

export function DriverPickupsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingStartId, setPendingStartId] = useState<string>();
  const pickups = useQuery({
    queryKey: ['driver-pickups', user?.id],
    queryFn: async () => {
      try {
        const data = await driverRepository.listToday(user!.id);
        await cacheToday(user!.id, data);
        return { data, cached: false };
      } catch {
        return { data: await getCachedToday(user!.id), cached: true };
      }
    },
    enabled: Boolean(user),
  });
  const start = useMutation({
    mutationFn: (id: string) => driverRepository.start(id, user!.id),
    onSuccess: async (ticket) => {
      queryClient.setQueryData(['driver-pickup', ticket.id], ticket);
      await queryClient.invalidateQueries({
        queryKey: ['driver-pickups', user?.id],
      });
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#159fb3]">
          Tugas Hari Ini
        </p>
        <h1 className="mt-1 text-2xl font-bold">Daftar pickup saya</h1>
      </div>

      {pickups.data?.cached && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
          Menampilkan data tersimpan karena koneksi tidak tersedia.
        </div>
      )}
      {start.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {start.error.message}
        </div>
      )}

      <div className="space-y-4">
        {pickups.data?.data.map((ticket) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            key={ticket.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{ticket.ticketCode}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {ticket.customerName ?? ticket.customerPhoneNumber}
                </p>
              </div>
              <StatusBadge status={ticket.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Kecamatan</dt>
                <dd className="font-semibold">
                  {DISTRICT_LABELS[ticket.district]}
                  {ticket.villageId && (
                    <span> · {getVillage(ticket.villageId)?.name}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Waktu</dt>
                <dd className="font-semibold">
                  {ticket.scheduledTimeWindow
                    ? `${ticket.scheduledTimeWindow.start}-${ticket.scheduledTimeWindow.end}`
                    : 'Belum ditentukan'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Volume</dt>
                <dd className="font-semibold">{ticket.volumeLevel}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Estimasi bak</dt>
                <dd className="font-semibold">
                  {ticket.tricycleLoadEstimate}
                </dd>
              </div>
            </dl>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              {ticket.addressText ?? 'Alamat belum tersedia'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                className="rounded-xl border border-[#159fb3] px-3 py-3 text-center text-sm font-bold text-[#087f8c]"
                href={mapsUrl(ticket)}
                rel="noreferrer"
                target="_blank"
              >
                Buka Maps
              </a>
              <a
                className="rounded-xl border border-[#159fb3] px-3 py-3 text-center text-sm font-bold text-[#087f8c]"
                href={`https://wa.me/${ticket.customerPhoneNumber}`}
                rel="noreferrer"
                target="_blank"
              >
                Chat WA
              </a>
              <Link
                className="rounded-xl bg-slate-800 px-3 py-3 text-center text-sm font-bold text-white"
                to={`/driver/pickups/${ticket.id}`}
              >
                Detail
              </Link>
              {ticket.status === 'ASSIGNED' ? (
                <button
                  className="rounded-xl bg-[#159fb3] px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
                  disabled={start.isPending}
                  onClick={() => setPendingStartId(ticket.id)}
                  type="button"
                >
                  Mulai
                </button>
              ) : (
                <Link
                  className="rounded-xl bg-[#159fb3] px-3 py-3 text-center text-sm font-bold text-white"
                  to={`/driver/pickups/${ticket.id}`}
                >
                  Lanjutkan
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
      {pickups.isLoading && (
        <p className="py-8 text-center text-slate-500">Memuat tugas...</p>
      )}
      {pickups.data?.data.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">
          Tidak ada tugas pickup hari ini.
        </div>
      )}
      <AppDialog
        busy={start.isPending}
        cancelLabel="Batal"
        confirmLabel="Mulai sekarang"
        description="Status permintaan akan berubah menjadi sedang dijemput dan operator dapat memantau progresnya."
        icon="truck"
        onCancel={() => setPendingStartId(undefined)}
        onConfirm={() => {
          if (!pendingStartId) return;
          start.mutate(pendingStartId, {
            onSettled: () => setPendingStartId(undefined),
          });
        }}
        open={Boolean(pendingStartId)}
        title="Mulai penjemputan?"
      />
    </div>
  );
}

function mapsUrl(ticket: {
  location?: { lat: number; lng: number };
  addressText?: string;
}) {
  const query = ticket.location
    ? `${ticket.location.lat},${ticket.location.lng}`
    : ticket.addressText ?? '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
