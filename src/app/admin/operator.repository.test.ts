import { describe, expect, it } from 'vitest';
import { DEMO_TICKETS } from './demo-data';
import {
  DemoOperatorRepository,
  filterTickets,
  summarize,
} from './operator.repository';

describe('operator repository', () => {
  it('memfilter permintaan berdasarkan query dan kecamatan', () => {
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

  it('menyimpan klasifikasi layanan profesional dan dampaknya', async () => {
    const repository = new DemoOperatorRepository();
    const updated = await repository.updateImpact('ticket-demo-1', {
      serviceCategory: 'event',
      serviceModel: 'berbayar',
      wasteTypes: ['plastik', 'kardus'],
      estimatedWeightKg: 25,
      dataQuality: 'estimated_by_operator',
      partnerDestination: 'tps3r_paleteang_bersinar',
      serviceFee: 500000,
      operationalCost: 225000,
      paidAmount: 250000,
      paymentStatus: 'dp',
      impactTags: ['layanan_profesional', 'pengurangan_sampah'],
    });

    expect(updated.serviceCategory).toBe('event');
    expect(updated.paymentStatus).toBe('dp');
    expect(updated.partnerDestination).toBe(
      'tps3r_paleteang_bersinar',
    );
  });

  it('membuat permintaan manual dari percakapan WhatsApp', async () => {
    const repository = new DemoOperatorRepository();
    const ticket = await repository.createManual({
      customerName: 'Ibu Rahma',
      customerPhoneNumber: '6281234567890',
      district: 'PALETEANG',
      villageId: 'temmassarangnge',
      addressText: 'Jalan Bulu Manarang, rumah hijau dekat masjid',
      serviceType: 'REGULAR_HOUSEHOLD_PICKUP',
      serviceCategory: 'warga',
      serviceModel: 'gratis',
      volumeLevel: 'MEDIUM',
      wasteTypes: ['plastik', 'kardus'],
      paymentStatus: 'gratis',
      impactTags: ['pengurangan_sampah'],
    });

    expect(ticket.source).toBe('WHATSAPP');
    expect(ticket.status).toBe('NEEDS_OPERATOR_REVIEW');
    expect(ticket.customerName).toBe('Ibu Rahma');
  });
});
