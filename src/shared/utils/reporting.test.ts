import { describe, expect, it } from 'vitest';
import { DEMO_TICKETS } from '../../app/admin/demo-data';
import { buildOperationalReport } from './reporting';

describe('buildOperationalReport', () => {
  it('menghitung tren dan ringkasan dalam periode inklusif', () => {
    const createdTicket = {
      ...structuredClone(DEMO_TICKETS[0]),
      createdAt: '2026-06-13T01:15:00.000Z',
      updatedAt: '2026-06-13T01:15:00.000Z',
    };
    const ticket = {
      ...structuredClone(DEMO_TICKETS[2]),
      status: 'COMPLETED' as const,
      scheduledDate: '2026-06-13',
      createdAt: '2026-06-13T00:30:00.000Z',
      completedAt: '2026-06-13T04:00:00.000Z',
      updatedAt: '2026-06-13T04:00:00.000Z',
    };

    const report = buildOperationalReport(
      [createdTicket, ticket, ticket],
      { startDate: '2026-06-13', endDate: '2026-06-13' },
    );

    expect(report.totals).toMatchObject({
      created: 2,
      scheduled: 1,
      completed: 1,
      completionRate: 100,
    });
    expect(report.daily[0]).toMatchObject({
      date: '2026-06-13',
      created: 2,
      scheduled: 1,
      completed: 1,
    });
    expect(report.rows).toHaveLength(2);
  });

  it('menolak periode lebih dari 31 hari', () => {
    expect(() =>
      buildOperationalReport([], {
        startDate: '2026-05-01',
        endDate: '2026-06-13',
      }),
    ).toThrow('Periode laporan maksimal 31 hari.');
  });
});
