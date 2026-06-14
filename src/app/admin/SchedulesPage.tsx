import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DISTRICT_LABELS } from '../../shared/constants/districts';
import { getOperationalDate } from '../../shared/utils/date';
import { operatorRepository } from './operator.repository';
import { buildScheduleGroups } from './schedule-view';
import { StatusBadge } from './StatusBadge';

export function SchedulesPage() {
  const [date, setDate] = useState(getOperationalDate());
  const tickets = useQuery({
    queryKey: ['schedule-tickets', date],
    queryFn: () => operatorRepository.listTickets({ scheduledDate: date }),
  });
  const groups = buildScheduleGroups(tickets.data ?? [], date);
  const scheduled = groups.flatMap((group) => group.tickets);
  const unassigned = scheduled.filter(
    (ticket) => !ticket.assignedDriverId,
  ).length;
  const inProgress = scheduled.filter(
    (ticket) => ticket.status === 'IN_PROGRESS',
  ).length;
  const completed = scheduled.filter(
    (ticket) => ticket.status === 'COMPLETED',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087f8c]">
            Jadwal Pickup
          </p>
          <h1 className="mt-2 text-3xl font-bold">Rencana operasional harian</h1>
          <p className="mt-2 text-slate-600">
            Tanggal mengikuti zona waktu Indonesia Tengah.
          </p>
        </div>
        <label className="text-sm font-bold">
          Tanggal
          <input
            className="mt-2 block rounded-xl border border-slate-300 bg-white px-4 py-3"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </label>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Summary label="Total pickup" value={scheduled.length} />
        <Summary label="Belum ada petugas" value={unassigned} tone="amber" />
        <Summary label="Dalam perjalanan" value={inProgress} tone="blue" />
        <Summary label="Selesai" value={completed} tone="green" />
      </section>

      {tickets.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          Jadwal tidak dapat dimuat.
        </div>
      )}
      {tickets.isLoading && (
        <p className="rounded-xl bg-white p-5 text-slate-500">
          Memuat jadwal...
        </p>
      )}

      <div className="space-y-5">
        {groups.map((group) => (
          <section
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            key={group.driverId}
          >
            <div
              className={`border-b px-5 py-4 ${
                group.driverId === 'unassigned'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <h2 className="font-bold">{group.driverName}</h2>
              <p className="text-sm text-slate-600">
                {group.tickets.length} pickup
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {group.tickets.map((ticket) => (
                <Link
                  className="grid gap-3 p-5 hover:bg-slate-50 sm:grid-cols-[120px_1fr_auto] sm:items-center"
                  key={ticket.id}
                  to={`/admin/tickets/${ticket.id}`}
                >
                  <div className="font-bold text-[#087f8c]">
                    {ticket.scheduledTimeWindow
                      ? `${ticket.scheduledTimeWindow.start}-${ticket.scheduledTimeWindow.end}`
                      : 'Belum ada jam'}
                  </div>
                  <div>
                    <p className="font-bold">{ticket.ticketCode}</p>
                    <p className="text-sm text-slate-600">
                      {ticket.customerName ?? ticket.customerPhoneNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {DISTRICT_LABELS[ticket.district]} -{' '}
                      {ticket.addressText ?? 'Alamat belum tersedia'}
                    </p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {!tickets.isLoading && groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Belum ada pickup terjadwal pada tanggal ini.
        </div>
      )}
    </div>
  );
}

function Summary({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: number;
  tone?: 'slate' | 'amber' | 'blue' | 'green';
}) {
  const styles = {
    slate: 'border-slate-200 bg-white',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    green: 'border-green-200 bg-green-50 text-green-900',
  };
  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${styles[tone]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}
