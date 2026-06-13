import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { WasteAiAnalysis } from '../../src/shared/schemas/ai.schema';
import type { WasteAnalyzer } from '../../src/server/ai/waste-analysis.service';
import { adminDb } from '../../src/server/firebase/admin';
import { COLLECTIONS } from '../../src/server/firebase/collections';
import { CustomerService } from '../../src/server/services/customer.service';
import { DriverPickupService } from '../../src/server/services/driver-pickup.service';
import { PickupReminderService } from '../../src/server/services/pickup-reminder.service';
import { PickupTicketService } from '../../src/server/services/pickup-ticket.service';
import { ReportService } from '../../src/server/services/report.service';
import { ServiceError } from '../../src/server/services/service-errors';
import { WhatsAppMessageService } from '../../src/server/whatsapp/message.service';
import type { MediaService } from '../../src/server/whatsapp/media.service';
import { WhatsAppIntakeService } from '../../src/server/whatsapp/intake.service';
import type { WhatsAppSender } from '../../src/server/whatsapp/whatsapp.client';

const service = new PickupTicketService(adminDb);
const customerService = new CustomerService(adminDb);
const driverService = new DriverPickupService(adminDb);
const reportService = new ReportService(adminDb);

const completeAnalysis: WasteAiAnalysis = {
  intent: 'PICKUP_REQUEST',
  detectedDistrict: 'PALETEANG',
  addressCompleteness: 'COMPLETE',
  photoQuality: 'CLEAR',
  wasteVisible: true,
  detectedWasteTypes: ['CARDBOARD'],
  volumeLevel: 'LARGE',
  tricycleLoadEstimate: 'THREE_QUARTERS',
  recommendedServiceType: 'ONE_TRIP_TRICYCLE',
  needsOperatorReview: true,
  needsMoreInfo: false,
  missingFields: [],
  safetyFlags: ['NONE'],
  customerReply: 'Data pickup sudah lengkap.',
  operatorSummary: 'Kardus cukup banyak untuk satu kali jalan.',
  confidence: 0.92,
};

class E2eMediaService implements MediaService {
  async downloadAndStoreImage() {
    return {
      bytes: Buffer.from('e2e-image'),
      mimeType: 'image/jpeg',
      storageUrl: 'gs://e2e-bucket/customer-waste/e2e.jpg',
    };
  }

  async readStoredImage() {
    return {
      bytes: Buffer.from('e2e-image'),
      mimeType: 'image/jpeg',
    };
  }
}

class E2eAnalyzer implements WasteAnalyzer {
  async analyze() {
    return completeAnalysis;
  }
}

class E2eSender implements WhatsAppSender {
  sent: Array<{ to: string; body: string }> = [];

  async sendText(to: string, body: string) {
    this.sent.push({ to, body });
    return `wamid.e2e-out-${this.sent.length}`;
  }
}

function e2eWebhookPayload() {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              contacts: [
                {
                  wa_id: '628555000111',
                  profile: { name: 'Ibu Endang' },
                },
              ],
              messages: [
                {
                  id: 'wamid.e2e-main-flow',
                  from: '628555000111',
                  timestamp: String(
                    Math.floor(
                      new Date('2026-06-13T01:00:00.000Z').getTime() / 1000,
                    ),
                  ),
                  type: 'image',
                  image: {
                    id: 'media-e2e',
                    mime_type: 'image/jpeg',
                    caption: 'Paleteang dekat masjid, mohon dijemput.',
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

const input = {
  idempotencyKey: 'wamid.integration-test-001',
  source: 'WHATSAPP',
  customer: {
    phoneNumber: '628123456789',
    displayName: 'Ibu Sari',
    district: 'PALETEANG',
    createdFrom: 'WHATSAPP',
  },
  district: 'PALETEANG',
  addressText: 'Dekat masjid',
  serviceType: 'ONE_TRIP_TRICYCLE',
  volumeLevel: 'LARGE',
  tricycleLoadEstimate: 'THREE_QUARTERS',
  photoUrls: ['https://example.com/waste.jpg'],
  initialStatus: 'NEEDS_OPERATOR_REVIEW',
} as const;

async function clearCollection(name: string) {
  const snapshot = await adminDb.collection(name).get();
  await Promise.all(snapshot.docs.map((document) => document.ref.delete()));
}

async function createAssignedTicket(scheduledDate = '2026-06-13') {
  const ticket = await service.create(input);
  const actor = { id: 'operator-1', role: 'OPERATOR' } as const;
  await service.updateStatus(ticket.id, { status: 'CONFIRMED' }, actor);
  await service.schedule(
    ticket.id,
    {
      scheduledDate,
      scheduledTimeWindow: { start: '09:00', end: '12:00' },
    },
    actor,
  );
  return service.assignDriver(
    ticket.id,
    { driverId: 'driver-1', driverName: 'Pak Amir' },
    actor,
  );
}

beforeEach(async () => {
  await Promise.all(Object.values(COLLECTIONS).map(clearCollection));
});

afterAll(async () => {
  await adminDb.terminate();
});

describe('PickupTicketService', () => {
  it('meng-upsert customer berdasarkan nomor WA tanpa duplikasi', async () => {
    const first = await customerService.upsert(input.customer);
    const second = await customerService.upsert({
      ...input.customer,
      addressText: 'Alamat baru',
    });
    const customers = await adminDb.collection(COLLECTIONS.customers).get();

    expect(second.id).toBe(first.id);
    expect(second.addressText).toBe('Alamat baru');
    expect(customers.size).toBe(1);
  });

  it('membuat customer, tiket, counter, idempotency key, dan audit log', async () => {
    const ticket = await service.create(
      input,
      { role: 'SYSTEM' },
      new Date('2026-06-12T16:30:00.000Z'),
    );

    expect(ticket.ticketCode).toBe('JSP-20260613-0001');
    expect(ticket.customerPhoneNumber).toBe('628123456789');

    const [customers, auditLogs, counters] = await Promise.all([
      adminDb.collection(COLLECTIONS.customers).get(),
      adminDb.collection(COLLECTIONS.auditLogs).get(),
      adminDb.collection(COLLECTIONS.ticketCounters).get(),
    ]);

    expect(customers.size).toBe(1);
    expect(auditLogs.size).toBe(1);
    expect(counters.docs[0].get('lastSequence')).toBe(1);
  });

  it('mengembalikan tiket yang sama untuk idempotency key yang sama', async () => {
    const first = await service.create(input);
    const second = await service.create(input);
    const tickets = await adminDb
      .collection(COLLECTIONS.pickupRequests)
      .get();

    expect(second.id).toBe(first.id);
    expect(tickets.size).toBe(1);
  });

  it('menaikkan counter untuk tiket berbeda pada hari yang sama', async () => {
    const first = await service.create(input);
    const second = await service.create({
      ...input,
      idempotencyKey: 'wamid.integration-test-002',
    });

    expect(first.ticketCode).toMatch(/-0001$/);
    expect(second.ticketCode).toMatch(/-0002$/);
  });

  it(
    'menghasilkan ticket code unik saat dibuat paralel',
    async () => {
      const tickets = await Promise.all(
        Array.from({ length: 5 }, (_, index) =>
          service.create({
            ...input,
            idempotencyKey: `wamid.parallel-${index}`,
          }),
        ),
      );
      const codes = new Set(tickets.map((ticket) => ticket.ticketCode));

      expect(codes.size).toBe(5);
    },
    15_000,
  );

  it('menolak tiket aktif di luar wilayah pilot', async () => {
    await expect(
      service.create({
        ...input,
        customer: {
          ...input.customer,
          district: 'OUT_OF_AREA',
        },
        district: 'OUT_OF_AREA',
      }),
    ).rejects.toMatchObject<ServiceError>({
      code: 'VALIDATION_ERROR',
    });
  });

  it('menolak transisi status ilegal dan mencatat transisi legal', async () => {
    const ticket = await service.create(input);

    await expect(
      service.updateStatus(
        ticket.id,
        { status: 'COMPLETED' },
        { id: 'operator-1', role: 'OPERATOR' },
      ),
    ).rejects.toMatchObject<ServiceError>({
      code: 'INVALID_STATUS_TRANSITION',
    });

    const confirmed = await service.updateStatus(
      ticket.id,
      { status: 'CONFIRMED', notes: 'Data sudah diverifikasi.' },
      { id: 'operator-1', role: 'OPERATOR' },
    );

    expect(confirmed.status).toBe('CONFIRMED');
    const auditLogs = await adminDb.collection(COLLECTIONS.auditLogs).get();
    expect(auditLogs.size).toBe(2);
  });

  it('memperbarui tiket NEEDS_INFO tanpa membuat tiket baru', async () => {
    const ticket = await service.create({
      ...input,
      photoUrls: [],
      volumeLevel: 'UNKNOWN',
      tricycleLoadEstimate: 'UNKNOWN',
      serviceType: 'UNKNOWN',
      initialStatus: 'NEEDS_INFO',
    });

    const updated = await service.updateIntake(ticket.id, {
      district: 'PALETEANG',
      addressText: 'Dekat Masjid',
      location: { lat: -3.793, lng: 119.652 },
      serviceType: 'ONE_TRIP_TRICYCLE',
      volumeLevel: 'LARGE',
      tricycleLoadEstimate: 'THREE_QUARTERS',
      wasteDescription: 'Kardus cukup banyak.',
      photoUrls: ['gs://bucket/photo.jpg'],
      aiAnalysis: {
        intent: 'PICKUP_REQUEST',
        detectedDistrict: 'PALETEANG',
        addressCompleteness: 'COMPLETE',
        photoQuality: 'CLEAR',
        wasteVisible: true,
        detectedWasteTypes: ['CARDBOARD'],
        volumeLevel: 'LARGE',
        tricycleLoadEstimate: 'THREE_QUARTERS',
        recommendedServiceType: 'ONE_TRIP_TRICYCLE',
        needsOperatorReview: true,
        needsMoreInfo: false,
        missingFields: [],
        safetyFlags: ['NONE'],
        customerReply: 'Data sudah lengkap.',
        operatorSummary: 'Kardus cukup banyak.',
        confidence: 0.9,
      },
      status: 'NEEDS_OPERATOR_REVIEW',
    });
    const tickets = await adminDb
      .collection(COLLECTIONS.pickupRequests)
      .get();
    const analyses = await adminDb.collection(COLLECTIONS.aiAnalyses).get();

    expect(updated.status).toBe('NEEDS_OPERATOR_REVIEW');
    expect(updated.photoUrls).toEqual(['gs://bucket/photo.jpg']);
    expect(tickets.size).toBe(1);
    expect(analyses.size).toBe(1);
  });

  it('menjadwalkan dan menugaskan driver secara berurutan', async () => {
    const ticket = await service.create(input);
    const actor = { id: 'operator-1', role: 'OPERATOR' } as const;
    await service.updateStatus(ticket.id, { status: 'CONFIRMED' }, actor);

    const scheduled = await service.schedule(
      ticket.id,
      {
        scheduledDate: '2026-06-20',
        scheduledTimeWindow: { start: '09:00', end: '12:00' },
        operatorNotes: 'Zona Paleteang pagi.',
      },
      actor,
    );
    const assigned = await service.assignDriver(
      ticket.id,
      { driverId: 'driver-1', driverName: 'Pak Amir' },
      actor,
    );

    expect(scheduled.status).toBe('SCHEDULED');
    expect(assigned.status).toBe('ASSIGNED');
    expect(assigned.assignedDriverName).toBe('Pak Amir');
  });

  it('menolak assign driver sebelum tiket dijadwalkan', async () => {
    const ticket = await service.create(input);

    await expect(
      service.assignDriver(
        ticket.id,
        { driverId: 'driver-1', driverName: 'Pak Amir' },
        { id: 'operator-1', role: 'OPERATOR' },
      ),
    ).rejects.toMatchObject<ServiceError>({
      code: 'INVALID_STATUS_TRANSITION',
    });
  });

  it('membatasi akses pickup berdasarkan driver yang ditugaskan', async () => {
    const ticket = await createAssignedTicket();

    await expect(
      driverService.getAssigned(ticket.id, 'driver-lain'),
    ).rejects.toMatchObject<ServiceError>({
      code: 'VALIDATION_ERROR',
    });
  });

  it('memulai pickup dan mencatat timestamp serta audit', async () => {
    const ticket = await createAssignedTicket();
    const started = await driverService.start(
      ticket.id,
      'driver-1',
      new Date('2026-06-13T01:00:00.000Z'),
    );
    const auditLogs = await adminDb.collection(COLLECTIONS.auditLogs).get();

    expect(started.status).toBe('IN_PROGRESS');
    expect(started.startedAt).toBe('2026-06-13T01:00:00.000Z');
    expect(auditLogs.size).toBe(5);
  });

  it('menyelesaikan pickup dan menyimpan bukti secara atomik', async () => {
    const ticket = await createAssignedTicket();
    await driverService.start(ticket.id, 'driver-1');

    const completed = await driverService.complete(
      ticket.id,
      'driver-1',
      {
        actualTripResult: 'COMPLETED_ONE_TRIP',
        beforePhotoUrls: ['https://example.com/before.jpg'],
        afterPhotoUrls: ['https://example.com/after.jpg'],
      },
      new Date('2026-06-13T02:00:00.000Z'),
    );
    const proofs = await adminDb.collection(COLLECTIONS.pickupProofs).get();

    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBe('2026-06-13T02:00:00.000Z');
    expect(proofs.size).toBe(1);
    expect(proofs.docs[0].get('driverId')).toBe('driver-1');
  });

  it('menghasilkan laporan harian dari tiket yang dibuat dan diselesaikan', async () => {
    const ticket = await createAssignedTicket();
    await adminDb.collection(COLLECTIONS.pickupRequests).doc(ticket.id).update({
      createdAt: new Date('2026-06-13T01:10:00.000Z'),
      updatedAt: new Date('2026-06-13T01:10:00.000Z'),
    });
    await driverService.complete(
      ticket.id,
      'driver-1',
      {
        actualTripResult: 'COMPLETED_ONE_TRIP',
        beforePhotoUrls: ['https://example.com/before.jpg'],
        afterPhotoUrls: [],
      },
      new Date('2026-06-13T02:00:00.000Z'),
    );

    const report = await reportService.getOperationalReport({
      startDate: '2026-06-13',
      endDate: '2026-06-13',
    });

    expect(report.totals).toMatchObject({
      created: 1,
      scheduled: 1,
      completed: 1,
      completionRate: 100,
    });
    expect(report.rows[0]).not.toHaveProperty('customerPhoneNumber');
  });

  it('mengirim reminder terjadwal satu kali secara idempotent', async () => {
    await createAssignedTicket('2026-06-14');
    const calls: Array<{
      to: string;
      templateName: string;
      parameters: string[];
    }> = [];
    const sender = {
      async sendTemplate(
        to: string,
        templateName: string,
        _languageCode: string,
        parameters: string[],
      ) {
        calls.push({ to, templateName, parameters });
        return 'wamid.reminder-1';
      },
    };
    const reminders = new PickupReminderService(
      sender,
      new WhatsAppMessageService(adminDb),
      adminDb,
    );
    const now = new Date('2026-06-13T00:00:00.000Z');

    const first = await reminders.run(now);
    const second = await reminders.run(now);
    const [deliveries, messages, audits] = await Promise.all([
      adminDb.collection(COLLECTIONS.reminderDeliveries).get(),
      adminDb
        .collection(COLLECTIONS.whatsappMessages)
        .where('direction', '==', 'OUTBOUND')
        .get(),
      adminDb
        .collection(COLLECTIONS.auditLogs)
        .where('action', '==', 'PICKUP_REMINDER_SENT')
        .get(),
    ]);

    expect(first).toMatchObject({ candidates: 1, sent: 1, skipped: 0 });
    expect(second).toMatchObject({ candidates: 1, sent: 0, skipped: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0].parameters).toEqual([
      expect.stringMatching(/^JSP-/),
      '2026-06-14',
      '09:00-12:00',
      'Pak Amir',
    ]);
    expect(deliveries.docs[0].get('status')).toBe('SENT');
    expect(messages.size).toBe(1);
    expect(audits.size).toBe(1);
  });

  it('mencatat kegagalan reminder dan mengizinkan retry', async () => {
    await createAssignedTicket('2026-06-14');
    let attempts = 0;
    const sender = {
      async sendTemplate() {
        attempts += 1;
        if (attempts === 1) throw new Error('provider unavailable');
        return 'wamid.reminder-retry';
      },
    };
    const reminders = new PickupReminderService(
      sender,
      new WhatsAppMessageService(adminDb),
      adminDb,
    );
    const now = new Date('2026-06-13T00:00:00.000Z');

    const first = await reminders.run(now);
    const second = await reminders.run(now);
    const delivery = (
      await adminDb.collection(COLLECTIONS.reminderDeliveries).get()
    ).docs[0];

    expect(first.failed).toBe(1);
    expect(second.sent).toBe(1);
    expect(delivery.get('status')).toBe('SENT');
    expect(delivery.get('attempts')).toBe(2);
  });

  it('menjalankan alur utama dari WhatsApp hingga laporan selesai', async () => {
    const messages = new WhatsAppMessageService(adminDb);
    const sender = new E2eSender();
    const intake = new WhatsAppIntakeService(
      messages,
      new E2eMediaService(),
      new E2eAnalyzer(),
      service,
      sender,
    );

    const [intakeResult] = await intake.processWebhook(e2eWebhookPayload());
    const ticketId = intakeResult.ticketId!;
    await adminDb.collection(COLLECTIONS.pickupRequests).doc(ticketId).update({
      createdAt: new Date('2026-06-13T01:10:00.000Z'),
      updatedAt: new Date('2026-06-13T01:10:00.000Z'),
    });
    const actor = { id: 'operator-e2e', role: 'OPERATOR' } as const;
    const reviewed = await service.updateStatus(
      ticketId,
      { status: 'CONFIRMED' },
      actor,
      new Date('2026-06-13T01:15:00.000Z'),
    );
    await service.schedule(
      ticketId,
      {
        scheduledDate: '2026-06-13',
        scheduledTimeWindow: { start: '09:00', end: '12:00' },
      },
      actor,
      new Date('2026-06-13T01:20:00.000Z'),
    );
    await service.assignDriver(
      ticketId,
      { driverId: 'driver-e2e', driverName: 'Pak E2E' },
      actor,
      new Date('2026-06-13T01:25:00.000Z'),
    );
    await driverService.start(
      ticketId,
      'driver-e2e',
      new Date('2026-06-13T02:00:00.000Z'),
    );
    const completed = await driverService.complete(
      ticketId,
      'driver-e2e',
      {
        actualTripResult: 'COMPLETED_ONE_TRIP',
        beforePhotoUrls: ['https://example.com/e2e-before.jpg'],
        afterPhotoUrls: ['https://example.com/e2e-after.jpg'],
      },
      new Date('2026-06-13T03:00:00.000Z'),
    );
    const report = await reportService.getOperationalReport({
      startDate: '2026-06-13',
      endDate: '2026-06-13',
    });
    const [customers, messagesSnapshot, proofs, audits] = await Promise.all([
      adminDb.collection(COLLECTIONS.customers).get(),
      adminDb.collection(COLLECTIONS.whatsappMessages).get(),
      adminDb.collection(COLLECTIONS.pickupProofs).get(),
      adminDb.collection(COLLECTIONS.auditLogs).get(),
    ]);

    expect(intakeResult).toMatchObject({
      duplicate: false,
      replySent: true,
      analysisFallback: false,
    });
    expect(reviewed.status).toBe('CONFIRMED');
    expect(completed.status).toBe('COMPLETED');
    expect(report.totals).toMatchObject({
      created: 1,
      scheduled: 1,
      completed: 1,
      completionRate: 100,
    });
    expect(sender.sent[0].body).toContain('Nomor permintaan:');
    expect(customers.size).toBe(1);
    expect(messagesSnapshot.size).toBe(2);
    expect(proofs.size).toBe(1);
    expect(audits.docs.map((document) => document.get('action'))).toEqual(
      expect.arrayContaining([
        'PICKUP_REQUEST_CREATED',
        'PICKUP_STATUS_CHANGED',
        'PICKUP_SCHEDULED',
        'PICKUP_DRIVER_ASSIGNED',
        'PICKUP_STARTED',
        'PICKUP_RESULT_RECORDED',
      ]),
    );
  });
});
