import { DISTRICT_LABELS } from '../../shared/constants/districts';
import { SERVICE_TYPE_LABELS } from '../../shared/constants/services';
import { PICKUP_STATUS_LABELS } from '../../shared/constants/statuses';
import {
  DATA_QUALITY_LABELS,
  PARTNER_DESTINATION_LABELS,
  PAYMENT_STATUS_LABELS,
  SERVICE_CATEGORY_LABELS,
  SERVICE_MODEL_LABELS,
} from '../../shared/constants/service-impact';
import type { OperationalReport } from '../../shared/schemas/report.schema';

function csvCell(value: string | number | undefined): string {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export function operationalReportToCsv(report: OperationalReport): string {
  const header = [
    'Kode Permintaan',
    'Tanggal Masuk',
    'Tanggal Jadwal',
    'Tanggal Selesai',
    'Kecamatan',
    'Layanan',
    'Kategori Layanan',
    'Model Layanan',
    'Jenis Sampah',
    'Berat Akhir (kg)',
    'Kualitas Data',
    'Tujuan Mitra',
    'Biaya Layanan',
    'Biaya Operasional',
    'Nominal Dibayar',
    'Status Pembayaran',
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
    SERVICE_CATEGORY_LABELS[row.serviceCategory],
    SERVICE_MODEL_LABELS[row.serviceModel],
    row.wasteTypes.join('; '),
    row.finalWeightKg,
    DATA_QUALITY_LABELS[row.dataQuality],
    row.partnerDestination
      ? PARTNER_DESTINATION_LABELS[row.partnerDestination]
      : '',
    row.serviceFee,
    row.operationalCost,
    row.paidAmount,
    PAYMENT_STATUS_LABELS[row.paymentStatus],
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
