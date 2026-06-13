import { describe, expect, it } from 'vitest';
import { DEMO_TICKETS } from './demo-data';
import {
  DemoOperatorRepository,
  filterTickets,
  summarize,
} from './operator.repository';

describe('operator repository', () => {
  it('memfilter tiket berdasarkan query dan kecamatan', () => {
    const results = filterTickets(DEMO_TICKETS, {
      query: 'ibu sari',
      district: 'PALETEANG',
    });

    expect(results).toHaveLength(1);
    expect(results[0].ticketCode).toBe('JSP-20260613-0001');
  });

  it('menghitung ringkasan status', () => {
    const summary = summarize(DEMO_TICKETS);

    expect(summary.needsInfo).toBe(1);
    expect(summary.needsReview).toBe(1);
    expect(summary.paleteang).toBe(2);
  });

  it('menjalankan konfirmasi, jadwal, dan assign secara berurutan', async () => {
    const repository = new DemoOperatorRepository();
    await repository.updateStatus('ticket-demo-1', { status: 'CONFIRMED' });
    await repository.schedule('ticket-demo-1', {
      scheduledDate: '2026-06-20',
      scheduledTimeWindow: { start: '09:00', end: '12:00' },
    });
    const assigned = await repository.assignDriver('ticket-demo-1', {
      driverId: 'driver-1',
      driverName: 'Pak Amir',
    });

    expect(assigned.status).toBe('ASSIGNED');
    expect(assigned.assignedDriverName).toBe('Pak Amir');
  });
});
