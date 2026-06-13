import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DISTRICT_LABELS } from '../../shared/constants/districts';
import {
  PICKUP_STATUSES,
  PICKUP_STATUS_LABELS,
  type PickupStatus,
} from '../../shared/constants/statuses';
import { SERVICE_TYPE_LABELS } from '../../shared/constants/services';
import { operatorRepository } from './operator.repository';
import type { TicketFilters } from './operator.types';
import { StatusBadge } from './StatusBadge';

export function TicketsPage() {
  const [filters, setFilters] = useState<TicketFilters>({});
  const tickets = useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => operatorRepository.listTickets(filters),
  });

  function updateFilter<K extends keyof TicketFilters>(
    key: K,
    value: TicketFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
          Tiket Masuk
        </p>
        <h1 className="mt-2 text-3xl font-bold">Kelola permintaan pickup</h1>
      </div>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <input
          aria-label="Cari tiket"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          onChange={(event) => updateFilter('query', event.target.value)}
          placeholder="Cari kode, nama, atau nomor WA"
          value={filters.query ?? ''}
        />
        <select
          aria-label="Filter status"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) =>
            updateFilter('status', event.target.value as PickupStatus)
          }
          value={filters.status ?? ''}
        >
          <option value="">Semua status</option>
          {PICKUP_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PICKUP_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter kecamatan"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) =>
            updateFilter(
              'district',
              event.target.value as TicketFilters['district'],
            )
          }
          value={filters.district ?? ''}
        >
          <option value="">Semua kecamatan</option>
          <option value="WATANG_SAWITTO">Watang Sawitto</option>
          <option value="PALETEANG">Paleteang</option>
        </select>
        <select
          aria-label="Filter volume"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) =>
            updateFilter(
              'volumeLevel',
              event.target.value as TicketFilters['volumeLevel'],
            )
          }
          value={filters.volumeLevel ?? ''}
        >
          <option value="">Semua volume</option>
          <option value="SMALL">Kecil</option>
          <option value="MEDIUM">Sedang</option>
          <option value="LARGE">Besar</option>
          <option value="OVERSIZED">Sangat besar</option>
        </select>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Tiket</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Kecamatan</th>
                <th className="px-4 py-3">Layanan</th>
                <th className="px-4 py-3">Volume</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.data?.map((ticket) => (
                <tr className="hover:bg-slate-50" key={ticket.id}>
                  <td className="px-4 py-4 font-bold">{ticket.ticketCode}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium">
                      {ticket.customerName ?? 'Tanpa nama'}
                    </p>
                    <p className="text-slate-500">
                      {ticket.customerPhoneNumber}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {DISTRICT_LABELS[ticket.district]}
                  </td>
                  <td className="px-4 py-4">
                    {SERVICE_TYPE_LABELS[ticket.serviceType]}
                  </td>
                  <td className="px-4 py-4">{ticket.volumeLevel}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      className="font-semibold text-green-700 hover:text-green-900"
                      to={`/admin/tickets/${ticket.id}`}
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tickets.isLoading && (
          <p className="p-6 text-center text-slate-500">Memuat tiket...</p>
        )}
        {tickets.data?.length === 0 && (
          <p className="p-6 text-center text-slate-500">
            Tidak ada tiket yang cocok dengan filter.
          </p>
        )}
      </section>
    </div>
  );
}
