import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DISTRICT_LABELS } from '../../shared/constants/districts';
import { SERVICE_TYPE_LABELS } from '../../shared/constants/services';
import { getOperationalDate } from '../../shared/utils/date';
import { downloadOperationalReport } from './report-csv';
import { operatorRepository } from './operator.repository';

const DAY_MS = 86_400_000;

function dateDaysAgo(days: number): string {
  const today = getOperationalDate();
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function ReportsPage() {
  const [startDate, setStartDate] = useState(() => dateDaysAgo(6));
  const [endDate, setEndDate] = useState(() => getOperationalDate());
  const periodValid =
    startDate <= endDate &&
    Date.parse(`${endDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`) <
      31 * DAY_MS;
  const report = useQuery({
    queryKey: ['operational-report', startDate, endDate],
    queryFn: () => operatorRepository.getOperationalReport({ startDate, endDate }),
    enabled: periodValid,
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#159fb3]">
          Laporan Operasional
        </p>
        <h1 className="mt-2 text-3xl font-bold">Kinerja layanan pickup</h1>
        <p className="mt-2 text-slate-600">
          Pantau volume tiket, penyelesaian, dan kebutuhan extra trip.
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
        <DateInput
          label="Tanggal mulai"
          value={startDate}
          onChange={setStartDate}
        />
        <DateInput
          label="Tanggal akhir"
          value={endDate}
          onChange={setEndDate}
        />
        <button
          className="rounded-xl bg-[#159fb3] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!report.data}
          onClick={() => report.data && downloadOperationalReport(report.data)}
          type="button"
        >
          Export CSV
        </button>
      </section>

      {!periodValid && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          Periode harus berurutan dan maksimal 31 hari.
        </p>
      )}
      {report.isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          Laporan gagal dimuat.
        </p>
      )}
      {report.isLoading && <p className="text-slate-500">Memuat laporan...</p>}

      {report.data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <Metric label="Tiket Masuk" value={report.data.totals.created} />
            <Metric label="Terjadwal" value={report.data.totals.scheduled} />
            <Metric label="Selesai" value={report.data.totals.completed} />
            <Metric label="Extra Trip" value={report.data.totals.extraTrip} />
            <Metric label="Batal/Ditolak" value={report.data.totals.cancelled} />
            <Metric
              label="Completion Rate"
              value={`${report.data.totals.completionRate}%`}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Breakdown
              title="Tiket Masuk per Kecamatan"
              values={Object.entries(report.data.byDistrict).map(
                ([key, value]) => ({
                  label:
                    DISTRICT_LABELS[key as keyof typeof DISTRICT_LABELS],
                  value,
                }),
              )}
            />
            <Breakdown
              title="Tiket Masuk per Layanan"
              values={Object.entries(report.data.byServiceType).map(
                ([key, value]) => ({
                  label:
                    SERVICE_TYPE_LABELS[
                      key as keyof typeof SERVICE_TYPE_LABELS
                    ],
                  value,
                }),
              )}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold">Tren Harian</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Masuk</th>
                    <th className="px-5 py-3">Terjadwal</th>
                    <th className="px-5 py-3">Selesai</th>
                    <th className="px-5 py-3">Extra Trip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.data.daily.map((day) => (
                    <tr key={day.date}>
                      <td className="px-5 py-3 font-semibold">{day.date}</td>
                      <td className="px-5 py-3">{day.created}</td>
                      <td className="px-5 py-3">{day.scheduled}</td>
                      <td className="px-5 py-3">{day.completed}</td>
                      <td className="px-5 py-3">{day.extraTrip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex-1 text-sm font-bold">
      {label}
      <input
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}

function Breakdown({
  title,
  values,
}: {
  title: string;
  values: { label: string; value: number }[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold">{title}</h2>
      <dl className="mt-4 space-y-3">
        {values.map((item) => (
          <div className="flex justify-between gap-4" key={item.label}>
            <dt className="text-slate-600">{item.label}</dt>
            <dd className="font-bold">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
