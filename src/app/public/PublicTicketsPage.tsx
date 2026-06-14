import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import { useAuth } from '../auth/auth-context';
import {
  AppHeader,
  EmptyState,
  LoadingState,
  TicketCard,
} from '../ui/components';
import { listPublicTickets } from './public-data';
import { loadCustomerTickets } from './public-ticket.repository';

export function PublicTicketsPage({ embedded = false }: { embedded?: boolean }) {
  const { authUid, user } = useAuth();
  const shouldLoadRemote = Boolean(authUid && user?.role === 'CUSTOMER');
  const localTickets = listPublicTickets();
  const pending = localTickets.filter(
    (ticket) => ticket.deliveryStatus !== 'SUBMITTED',
  );
  const [remoteTickets, setRemoteTickets] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(shouldLoadRemote);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!authUid || user?.role !== 'CUSTOMER') return;
    let active = true;
    void loadCustomerTickets(authUid)
      .then((tickets) => {
        if (active) setRemoteTickets(tickets);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authUid, user?.role]);

  const empty = pending.length === 0 && remoteTickets.length === 0;
  return (
    <>
      {!embedded && (
        <AppHeader
          subtitle="Pantau permintaan yang sudah diterima operator"
          title="Permintaan Saya"
        />
      )}
      <main className="app-container py-7">
        {embedded && (
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold">Permintaan Saya</h2>
            <p className="mt-1 text-sm text-slate-500">
              Riwayat draft dan permintaan yang sudah dikirim.
            </p>
          </div>
        )}
        {loading ? (
          <LoadingState label="Memuat permintaan..." />
        ) : empty ? (
          <EmptyState
            action={
              <Link
                className="inline-flex rounded-2xl bg-[#087f8c] px-5 py-3 font-bold text-white"
                to="/pickup/new"
              >
                Ajukan Jemput
              </Link>
            }
            description="Permintaan yang sudah dikirim akan muncul di sini."
            illustration={{
              src: '/illustrations/empty-ticket.webp',
              alt: 'Warga menyiapkan permintaan jemput sampah dari ponsel',
            }}
            title="Belum ada permintaan"
          />
        ) : (
          <div className="space-y-4">
            {error && (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Status terbaru belum dapat dimuat. Periksa koneksi lalu buka
                kembali halaman ini.
              </p>
            )}
            {pending.map((ticket) => (
              <TicketCard
                address={ticket.address}
                code={ticket.code}
                draft
                key={ticket.id}
                status={ticket.status}
              >
                <Link
                  className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800"
                  to={`/tickets/${ticket.id}`}
                >
                  Menunggu dikirim
                  <span aria-hidden>&rarr;</span>
                </Link>
              </TicketCard>
            ))}
            {remoteTickets.map((ticket) => (
              <TicketCard
                address={ticket.addressText ?? 'Alamat belum tersedia'}
                code={ticket.ticketCode}
                key={ticket.id}
                schedule={
                  ticket.scheduledDate
                    ? `${ticket.scheduledDate} ${ticket.scheduledTimeWindow?.start ?? ''}`
                    : undefined
                }
                status={ticket.status}
              >
                <Link
                  className="flex items-center justify-between rounded-2xl bg-[#e6f7fa] px-4 py-3 text-sm font-bold text-[#087f8c]"
                  to={`/tickets/${ticket.id}?remote=1`}
                >
                  Lihat status
                  <span aria-hidden>&rarr;</span>
                </Link>
              </TicketCard>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
