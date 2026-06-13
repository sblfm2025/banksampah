import { describe, expect, it } from 'vitest';
import type { WasteAiAnalysis } from '../../shared/schemas/ai.schema';
import type { CreatePickupRequestInput, UpdatePickupIntakeInput } from '../../shared/schemas/pickup-input.schema';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import type { ParsedWhatsAppMessage } from '../../shared/schemas/whatsapp.schema';
import type { WasteAnalyzer } from '../ai/waste-analysis.service';
import type { StoredWhatsAppMessage } from './message.service';
import type { MediaService } from './media.service';
import { WhatsAppIntakeService } from './intake.service';
import type { WhatsAppSender } from './whatsapp.client';

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
  customerReply: 'Data sudah lengkap.',
  operatorSummary: 'Kardus cukup banyak.',
  confidence: 0.9,
};

function payload(input: {
  id?: string;
  type?: string;
  text?: string;
  mediaId?: string;
}) {
  const type = input.type ?? 'text';
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              contacts: [
                {
                  wa_id: '628123456789',
                  profile: { name: 'Ibu Sari' },
                },
              ],
              messages: [
                {
                  id: input.id ?? 'wamid-1',
                  from: '628123456789',
                  timestamp: '1781290800',
                  type,
                  text: type === 'text' ? { body: input.text } : undefined,
                  image:
                    type === 'image'
                      ? {
                          id: input.mediaId ?? 'media-1',
                          mime_type: 'image/jpeg',
                        }
                      : undefined,
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

class FakeMessages {
  records: StoredWhatsAppMessage[] = [];
  outbound: string[] = [];
  processedTicketId?: string;

  async saveInbound(message: ParsedWhatsAppMessage) {
    const existing = this.records.find(
      (record) => record.waMessageId === message.waMessageId,
    );
    if (existing) return { message: existing, isNew: false };

    const stored: StoredWhatsAppMessage = {
      ...message,
      id: `id-${message.waMessageId}`,
      direction: 'INBOUND',
      processed: false,
    };
    this.records.push(stored);
    return { message: stored, isNew: true };
  }

  async attachMedia(id: string, mediaUrl: string) {
    this.records.find((record) => record.id === id)!.mediaUrl = mediaUrl;
  }

  async listRecent(phoneNumber: string, since: Date) {
    return this.records.filter(
      (record) =>
        record.fromPhoneNumber === phoneNumber && record.occurredAt >= since,
    );
  }

  async markProcessed(ids: string[], relatedTicketId?: string) {
    this.processedTicketId = relatedTicketId;
    this.records
      .filter((record) => ids.includes(record.id))
      .forEach((record) => {
        record.processed = true;
        record.relatedTicketId = relatedTicketId;
      });
  }

  async saveOutbound(input: { text: string }) {
    this.outbound.push(input.text);
    return 'outbound-id';
  }
}

class FakeMedia implements MediaService {
  async downloadAndStoreImage() {
    return {
      bytes: Buffer.from('image'),
      mimeType: 'image/jpeg',
      storageUrl: 'gs://bucket/photo.jpg',
    };
  }

  async readStoredImage() {
    return { bytes: Buffer.from('image'), mimeType: 'image/jpeg' };
  }
}

class FakeAnalyzer implements WasteAnalyzer {
  constructor(
    private readonly result: WasteAiAnalysis = completeAnalysis,
    private readonly shouldFail = false,
  ) {}

  async analyze() {
    if (this.shouldFail) throw new Error('AI failed');
    return this.result;
  }
}

class FakeTickets {
  created?: CreatePickupRequestInput;
  updated?: UpdatePickupIntakeInput;
  existing: PickupRequest | null = null;

  async findOpenByPhoneNumber() {
    return this.existing;
  }

  async create(input: CreatePickupRequestInput): Promise<PickupRequest> {
    this.created = input;
    return {
      id: 'ticket-1',
      ticketCode: 'JSP-20260613-0001',
      source: 'WHATSAPP',
      customerId: 'customer-1',
      customerPhoneNumber: input.customer.phoneNumber,
      district: input.district,
      serviceType: input.serviceType,
      volumeLevel: input.volumeLevel,
      tricycleLoadEstimate: input.tricycleLoadEstimate,
      photoUrls: input.photoUrls,
      status: input.initialStatus,
      createdAt: '2026-06-13T00:00:00.000Z',
      updatedAt: '2026-06-13T00:00:00.000Z',
    };
  }

  async updateIntake(_id: string, input: UpdatePickupIntakeInput) {
    this.updated = input;
    return { ...this.existing!, ...input };
  }
}

class FakeSender implements WhatsAppSender {
  sent: Array<{ to: string; body: string }> = [];

  async sendText(to: string, body: string) {
    this.sent.push({ to, body });
    return `wamid-out-${this.sent.length}`;
  }
}

describe('WhatsAppIntakeService', () => {
  it('membuat tiket dan balasan saat data lengkap', async () => {
    const messages = new FakeMessages();
    const tickets = new FakeTickets();
    const sender = new FakeSender();
    const service = new WhatsAppIntakeService(
      messages,
      new FakeMedia(),
      new FakeAnalyzer(),
      tickets,
      sender,
    );

    await service.processWebhook(
      payload({
        type: 'image',
        text: 'Paleteang dekat masjid',
      }),
    );

    expect(tickets.created?.district).toBe('PALETEANG');
    expect(tickets.created?.photoUrls).toEqual(['gs://bucket/photo.jpg']);
    expect(sender.sent[0].body).toContain('JSP-20260613-0001');
    expect(messages.processedTicketId).toBe('ticket-1');
  });

  it('tidak membuat tiket aktif untuk luar wilayah', async () => {
    const messages = new FakeMessages();
    const tickets = new FakeTickets();
    const sender = new FakeSender();
    const service = new WhatsAppIntakeService(
      messages,
      new FakeMedia(),
      new FakeAnalyzer({
        ...completeAnalysis,
        detectedDistrict: 'OUT_OF_AREA',
        recommendedServiceType: 'REJECT',
      }),
      tickets,
      sender,
    );

    await service.processWebhook(payload({ text: 'Saya di Suppa' }));

    expect(tickets.created).toBeUndefined();
    expect(sender.sent[0].body).toContain('Watang Sawitto');
  });

  it('mengabaikan delivery ulang berdasarkan waMessageId', async () => {
    const messages = new FakeMessages();
    const tickets = new FakeTickets();
    const sender = new FakeSender();
    const service = new WhatsAppIntakeService(
      messages,
      new FakeMedia(),
      new FakeAnalyzer(),
      tickets,
      sender,
    );
    const incoming = payload({ id: 'wamid-duplicate', text: 'Paleteang' });

    await service.processWebhook(incoming);
    const second = await service.processWebhook(incoming);

    expect(second[0].duplicate).toBe(true);
    expect(sender.sent).toHaveLength(1);
  });

  it('memproses ulang pesan duplikat yang sebelumnya belum selesai', async () => {
    const messages = new FakeMessages();
    const tickets = new FakeTickets();
    const sender = new FakeSender();
    const service = new WhatsAppIntakeService(
      messages,
      new FakeMedia(),
      new FakeAnalyzer(),
      tickets,
      sender,
    );
    const incoming = payload({ id: 'wamid-retry', text: 'Paleteang' });
    const parsed = {
      waMessageId: 'wamid-retry',
      fromPhoneNumber: '628123456789',
      customerDisplayName: 'Ibu Sari',
      messageType: 'TEXT' as const,
      text: 'Paleteang',
      occurredAt: new Date(1781290800 * 1000),
      rawPayload: {},
    };
    await messages.saveInbound(parsed);

    const result = await service.processWebhook(incoming);

    expect(result[0].duplicate).toBe(false);
    expect(sender.sent).toHaveLength(1);
  });

  it('menggunakan fallback aman saat analyzer gagal', async () => {
    const messages = new FakeMessages();
    const tickets = new FakeTickets();
    const sender = new FakeSender();
    const service = new WhatsAppIntakeService(
      messages,
      new FakeMedia(),
      new FakeAnalyzer(completeAnalysis, true),
      tickets,
      sender,
    );

    const result = await service.processWebhook(
      payload({ text: 'Mau jemput di Paleteang' }),
    );

    expect(result[0].analysisFallback).toBe(true);
    expect(tickets.created?.initialStatus).toBe('NEEDS_INFO');
  });
});
