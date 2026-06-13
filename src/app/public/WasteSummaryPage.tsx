import { Link } from 'react-router-dom';
import { AppHeader, Card, EmptyState, StatCard } from '../ui/components';
import { listPublicTickets } from './public-data';

export function WasteSummaryPage() {
  const tickets = listPublicTickets();
  const completed = tickets.filter((ticket) => ticket.status === 'COMPLETED');
  const active = tickets.filter((ticket) => ticket.status !== 'COMPLETED');
  return (
    <>
      <AppHeader
        subtitle="Ringkasan aktivitas penjemputan"
        title="Sampahku"
      />
      <main className="app-container space-y-7 py-7">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="truck"
            label="Total jemputan"
            tone="primary"
            value={tickets.length}
          />
          <StatCard
            icon="clock"
            label="Tiket aktif"
            tone="amber"
            value={active.length}
          />
          <StatCard
            icon="leaf"
            label="Riwayat selesai"
            tone="green"
            value={completed.length}
          />
          <StatCard
            icon="spark"
            label="Poin hijau nanti"
            tone="green"
            value="Segera"
          />
        </div>
        <Card className="p-6">
          <h2 className="font-extrabold">Catatan aktivitas</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sistem belum menampilkan kilogram karena layanan pilot belum
            menggunakan data timbang.
          </p>
        </Card>
        {tickets.length === 0 && (
          <EmptyState
            action={
              <Link
                className="inline-flex rounded-2xl bg-[#159fb3] px-5 py-3 font-bold text-white"
                to="/pickup/new"
              >
                Kirim foto sampah
              </Link>
            }
            description="Mulai dari foto sampah dan lokasi penjemputan."
            title="Belum ada aktivitas"
          />
        )}
      </main>
    </>
  );
}
