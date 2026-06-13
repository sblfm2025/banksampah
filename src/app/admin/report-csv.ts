import { DISTRICT_LABELS } from '../../shared/constants/districts';
import { SERVICE_TYPE_LABELS } from '../../shared/constants/services';
import { PICKUP_STATUS_LABELS } from '../../shared/constants/statuses';
import type { OperationalReport } from '../../shared/schemas/report.schema';

function csvCell(value: string | number | undefined): string {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export function operationalReportToCsv(report: OperationalReport): string {
  const header = [
    'Kode Tiket',
    'Tanggal Masuk',
    'Tanggal Jadwal',
    'Tanggal Selesai',
    'Kecamatan',
    'Layanan',
    'Status',
    'Petugas',
  ];
  const rows = report.rows.map((row) => [
    row.ticketCode,
    row.createdDate,
    row.scheduledDate,
    row.completedDate,
    DISTRICT_LABELS[row.district],
    SERVICE_TYPE_LABELS[row.serviceType],
    PICKUP_STATUS_LABELS[row.status],
    row.driverName,
  ]);

  return [header, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
}

export function downloadOperationalReport(report: OperationalReport) {
  const csv = operationalReportToCsv(report);
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `laporan-pickup-${report.period.startDate}-${report.period.endDate}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
