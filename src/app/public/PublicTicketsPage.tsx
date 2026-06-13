import { Link } from 'react-router-dom';
import { AppHeader, EmptyState, TicketCard } from '../ui/components';
import { listPublicTickets } from './public-data';

export function PublicTicketsPage() {
  const tickets = listPublicTickets();
  return (
    <>
      <AppHeader
        subtitle="Draft pengajuan yang tersimpan di perangkat ini"
        title="Draft Jemput"
      />
      <main className="app-container py-7">
        {tickets.length === 0 ? (
          <EmptyState
            action={
              <Link
                className="inline-flex rounded-2xl bg-[#159fb3] px-5 py-3 font-bold text-white"
                to="/pickup/new"
              >
                Ajukan Jemput
              </Link>
            }
            description="Draft yang dibuat dari perangkat ini akan muncul di sini."
            illustration={{
              src: '/illustrations/empty-ticket.webp',
              alt: 'Warga menyiapkan pengajuan jemput sampah dari ponsel',
            }}
            title="Belum ada permintaan"
          />
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <TicketCard
                address={ticket.address}
                code={ticket.code}
                draft
                key={ticket.id}
                status={ticket.status}
              >
                <Link
                  className="flex items-center justify-between rounded-2xl bg-[#e6f7fa] px-4 py-3 text-sm font-bold text-[#087f8c]"
                  to={`/tickets/${ticket.id}`}
                >
                  Lihat detail
                  <span aria-hidden>→</span>
                </Link>
              </TicketCard>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
