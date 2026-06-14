import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { operatorRepository } from './operator.repository';
import { ErrorState, StatCard } from '../ui/components';

const cards = [
  { key: 'newToday', label: 'Permintaan baru hari ini', tone: 'primary', icon: 'ticket' },
  { key: 'needsInfo', label: 'Butuh data', tone: 'amber', icon: 'clock' },
  { key: 'needsReview', label: 'Perlu dicek', tone: 'amber', icon: 'spark' },
  { key: 'scheduledToday', label: 'Terjadwal hari ini', tone: 'primary', icon: 'calendar' },
  { key: 'completedToday', label: 'Selesai hari ini', tone: 'green', icon: 'leaf' },
  { key: 'extraTrip', label: 'Butuh extra trip', tone: 'amber', icon: 'truck' },
  { key: 'watangSawitto', label: 'Watang Sawitto', tone: 'green', icon: 'pin' },
  { key: 'paleteang', label: 'Paleteang', tone: 'green', icon: 'pin' },
] as const;

export function AdminOverview() {
  const summary = useQuery({
    queryKey: ['operator-summary'],
    queryFn: () => operatorRepository.getSummary(),
  });
  const urgent = useQuery({
    queryKey: ['tickets', { status: 'NEEDS_OPERATOR_REVIEW' }],
    queryFn: () =>
      operatorRepository.listTickets({ status: 'NEEDS_OPERATOR_REVIEW' }),
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087f8c]">
          Ringkasan Operasional
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Kondisi layanan hari ini
        </h1>
        <p className="mt-2 text-slate-600">
          Prioritaskan permintaan yang butuh data atau verifikasi operator.
        </p>
      </section>

      {summary.isError ? (
        <ErrorState message="Ringkasan gagal dimuat." />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard
              icon={card.icon}
              key={card.key}
              label={card.label}
              tone={card.tone}
              value={summary.data?.[card.key] ?? '...'}
            />
          ))}
        </section>
      )}

      <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_10px_35px_rgb(15_23_42/0.06)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">Perlu tindakan operator</h2>
            <p className="text-sm text-slate-500">
              Permintaan terbaru yang menunggu verifikasi.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-[#087f8c] hover:text-[#075e68]"
            to="/admin/tickets"
          >
            Lihat semua
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {urgent.isLoading && (
            <p className="p-6 text-sm text-slate-500">
              Memuat permintaan...
            </p>
          )}
          {urgent.data?.slice(0, 5).map((ticket) => (
            <Link
              className="flex flex-col gap-2 px-6 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              key={ticket.id}
              to={`/admin/tickets/${ticket.id}`}
            >
              <div>
                <p className="font-bold text-slate-900">{ticket.ticketCode}</p>
                <p className="text-sm text-slate-500">
                  {ticket.customerName ?? ticket.customerPhoneNumber}
                </p>
              </div>
              <p className="text-sm font-medium text-orange-700">
                {ticket.aiAnalysis?.operatorSummary ??
                  ticket.wasteDescription ??
                  'Belum ada ringkasan'}
              </p>
            </Link>
          ))}
          {urgent.data?.length === 0 && (
            <p className="p-6 text-sm text-slate-500">
              Tidak ada permintaan yang menunggu verifikasi.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
