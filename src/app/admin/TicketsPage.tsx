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
import {
  SERVICE_VILLAGES,
  getVillage,
} from '../../shared/regions/service-areas';

export function TicketsPage() {
  const [filters, setFilters] = useState<TicketFilters>({});
  const drivers = useQuery({
    queryKey: ['drivers', 'ticket-filter'],
    queryFn: () => operatorRepository.listDrivers(),
  });
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087f8c]">
            Permintaan Masuk
          </p>
          <h1 className="mt-2 text-3xl font-bold">Kelola permintaan pickup</h1>
        </div>
        <Link
          className="inline-flex justify-center rounded-xl bg-[#087f8c] px-5 py-3 font-bold text-white"
          to="/admin/tickets/new"
        >
          Buat dari WhatsApp
        </Link>
      </div>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4 xl:grid-cols-8">
        <input
          aria-label="Cari permintaan"
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
        <input
          aria-label="Filter tanggal jadwal"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) =>
            updateFilter('scheduledDate', event.target.value)
          }
          type="date"
          value={filters.scheduledDate ?? ''}
        />
        <select
          aria-label="Filter driver"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) =>
            updateFilter('assignedDriverId', event.target.value)
          }
          value={filters.assignedDriverId ?? ''}
        >
          <option value="">Semua driver</option>
          {(drivers.data ?? [])
            .filter((driver) => driver.isActive)
            .map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
        </select>
        <select
          aria-label="Filter layanan"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) =>
            updateFilter(
              'serviceType',
              event.target.value as TicketFilters['serviceType'],
            )
          }
          value={filters.serviceType ?? ''}
        >
          <option value="">Semua layanan</option>
          {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter kelurahan"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) =>
            updateFilter('villageId', event.target.value)
          }
          value={filters.villageId ?? ''}
        >
          <option value="">Semua kelurahan</option>
          {SERVICE_VILLAGES.filter(
            (village) =>
              !filters.district || village.districtId === filters.district,
          ).map((village) => (
            <option key={village.id} value={village.id}>
              {village.name}
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
                <th className="px-4 py-3">Permintaan</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Kecamatan</th>
                <th className="px-4 py-3">Kelurahan</th>
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
                    {getVillage(ticket.villageId)?.name ??
                      ticket.village ??
                      '-'}
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
                      className="font-semibold text-[#087f8c] hover:text-[#075e68]"
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
          <p className="p-6 text-center text-slate-500">
            Memuat permintaan...
          </p>
        )}
        {tickets.isError && (
          <p className="p-6 text-center text-red-700">
            Permintaan gagal dimuat. Periksa koneksi atau index Firestore
            untuk kombinasi filter ini.
          </p>
        )}
        {tickets.data?.length === 0 && (
          <p className="p-6 text-center text-slate-500">
            Tidak ada permintaan yang cocok dengan filter.
          </p>
        )}
      </section>
    </div>
  );
}
