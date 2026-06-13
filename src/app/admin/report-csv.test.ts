import { describe, expect, it } from 'vitest';
import { buildOperationalReport } from '../../shared/utils/reporting';
import { DEMO_TICKETS } from './demo-data';
import { operationalReportToCsv } from './report-csv';

describe('operationalReportToCsv', () => {
  it('mengekspor atribut operasional tanpa data pribadi customer', () => {
    const tickets = DEMO_TICKETS.map((ticket, index) => ({
      ...structuredClone(ticket),
      createdAt: `2026-06-13T0${index + 1}:00:00.000Z`,
      updatedAt: `2026-06-13T0${index + 1}:00:00.000Z`,
      scheduledDate: ticket.scheduledDate ? '2026-06-13' : undefined,
    }));
    const report = buildOperationalReport(tickets, {
      startDate: '2026-06-13',
      endDate: '2026-06-13',
    });

    const csv = operationalReportToCsv(report);

    expect(csv).toContain('Kode Permintaan');
    expect(csv).toContain('JSP-20260613-0001');
    expect(csv).not.toContain('Ibu Sari');
    expect(csv).not.toContain('628123456789');
  });
});
