import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { operatorRepository } from './operator.repository';

const cards = [
  { key: 'newToday', label: 'Tiket baru hari ini', tone: 'blue' },
  { key: 'needsInfo', label: 'Butuh data', tone: 'amber' },
  { key: 'needsReview', label: 'Perlu dicek', tone: 'orange' },
  { key: 'scheduledToday', label: 'Terjadwal hari ini', tone: 'violet' },
  { key: 'completedToday', label: 'Selesai hari ini', tone: 'green' },
  { key: 'extraTrip', label: 'Butuh extra trip', tone: 'red' },
  { key: 'watangSawitto', label: 'Watang Sawitto', tone: 'slate' },
  { key: 'paleteang', label: 'Paleteang', tone: 'slate' },
] as const;

const toneClasses = {
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  orange: 'border-orange-200 bg-orange-50 text-orange-800',
  violet: 'border-violet-200 bg-violet-50 text-violet-800',
  green: 'border-green-200 bg-green-50 text-green-800',
  red: 'border-red-200 bg-red-50 text-red-800',
  slate: 'border-slate-200 bg-white text-slate-800',
} as const;

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
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
          Ringkasan Operasional
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Kondisi layanan hari ini
        </h1>
        <p className="mt-2 text-slate-600">
          Prioritaskan tiket yang butuh data atau verifikasi operator.
        </p>
      </section>

      {summary.isError ? (
        <ErrorPanel message="Ringkasan gagal dimuat." />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article
              className={`rounded-2xl border p-5 shadow-sm ${toneClasses[card.tone]}`}
              key={card.key}
            >
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="mt-3 text-3xl font-bold">
                {summary.data?.[card.key] ?? '...'}
              </p>
            </article>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">Perlu tindakan operator</h2>
            <p className="text-sm text-slate-500">
              Tiket terbaru yang menunggu verifikasi.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-green-700 hover:text-green-900"
            to="/admin/tickets"
          >
            Lihat semua
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {urgent.isLoading && (
            <p className="p-6 text-sm text-slate-500">Memuat tiket...</p>
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
              Tidak ada tiket yang menunggu verifikasi.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
      {message}
    </div>
  );
}
