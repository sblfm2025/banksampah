import type { WasteAiAnalysis } from '../../shared/schemas/ai.schema';
import { isActiveDistrict } from '../../shared/constants/districts';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import {
  AiAnalysisError,
  createSafeFallbackAnalysis,
  type WasteAnalyzer,
} from '../ai/waste-analysis.service';
import type { PickupTicketService } from '../services/pickup-ticket.service';
import { assembleConversation } from './conversation';
import type {
  StoredWhatsAppMessage,
  WhatsAppMessageService,
} from './message.service';
import type { MediaService } from './media.service';
import {
  outOfAreaTemplate,
  safeFallbackTemplate,
  ticketCreatedTemplate,
} from './templates';
import type { WhatsAppSender } from './whatsapp.client';
import { parseWhatsAppWebhook } from './webhook-parser';

const CONVERSATION_WINDOW_MS = 30 * 60 * 1000;

export interface IntakeResult {
  waMessageId: string;
  duplicate: boolean;
  ticketId?: string;
  replySent: boolean;
  analysisFallback: boolean;
}

type MessageStore = Pick<
  WhatsAppMessageService,
  | 'saveInbound'
  | 'attachMedia'
  | 'listRecent'
  | 'markProcessed'
  | 'saveOutbound'
>;

type TicketStore = Pick<
  PickupTicketService,
  'create' | 'findOpenByPhoneNumber' | 'updateIntake'
>;

export class WhatsAppIntakeService {
  constructor(
    private readonly messages: MessageStore,
    private readonly media: MediaService,
    private readonly analyzer: WasteAnalyzer,
    private readonly tickets: TicketStore,
    private readonly sender: WhatsAppSender,
  ) {}

  async processWebhook(payload: unknown): Promise<IntakeResult[]> {
    const inboundMessages = parseWhatsAppWebhook(payload);
    const results: IntakeResult[] = [];

    for (const inbound of inboundMessages) {
      const saved = await this.messages.saveInbound(inbound);
      if (!saved.isNew && saved.message.processed) {
        results.push({
          waMessageId: inbound.waMessageId,
          duplicate: true,
          replySent: false,
          analysisFallback: false,
        });
        continue;
      }

      if (['AUDIO', 'DOCUMENT', 'UNKNOWN'].includes(inbound.messageType)) {
        const reply =
          'Mohon kirim permintaan dalam bentuk teks, foto sampah, atau share location WhatsApp.';
        await this.sendAndRecord(inbound.fromPhoneNumber, reply);
        await this.messages.markProcessed([saved.message.id]);
        results.push({
          waMessageId: inbound.waMessageId,
          duplicate: false,
          replySent: true,
          analysisFallback: false,
        });
        continue;
      }

      if (inbound.messageType === 'IMAGE' && inbound.mediaId) {
        const storedMedia = await this.media.downloadAndStoreImage({
          mediaId: inbound.mediaId,
          preferredMimeType: inbound.mediaMimeType,
          phoneNumber: inbound.fromPhoneNumber,
          waMessageId: inbound.waMessageId,
        });
        await this.messages.attachMedia(saved.message.id, storedMedia.storageUrl);
      }

      results.push(await this.processConversation(saved.message));
    }

    return results;
  }

  private async processConversation(
    triggeringMessage: StoredWhatsAppMessage,
  ): Promise<IntakeResult> {
    const recent = await this.messages.listRecent(
      triggeringMessage.fromPhoneNumber,
      new Date(triggeringMessage.occurredAt.getTime() - CONVERSATION_WINDOW_MS),
    );
    const conversation = assembleConversation(recent);
    const images = await Promise.all(
      conversation.imageUrls.map((url) => this.media.readStoredImage(url)),
    );
    let analysis: WasteAiAnalysis;
    let analysisFallback = false;

    try {
      analysis = await this.analyzer.analyze({
        text: conversation.text,
        locationText:
          conversation.location?.address ?? conversation.location?.name,
        hasLocation: Boolean(conversation.location),
        images,
      });
    } catch (error) {
      analysisFallback = true;
      analysis = createSafeFallbackAnalysis({
        text: conversation.text,
        hasImage: images.length > 0,
        hasLocation: Boolean(conversation.location),
      });
      if (error instanceof AiAnalysisError) {
        analysis.rawModelOutput = error.rawOutput;
      }
    }
    analysis.sourceMessageIds = conversation.sourceMessageIds;

    if (analysis.detectedDistrict === 'OUT_OF_AREA') {
      await this.sendAndRecord(conversation.phoneNumber, outOfAreaTemplate);
      await this.messages.markProcessed(conversation.sourceMessageIds);
      return {
        waMessageId: triggeringMessage.waMessageId,
        duplicate: false,
        replySent: true,
        analysisFallback,
      };
    }

    if (analysis.intent !== 'PICKUP_REQUEST') {
      await this.sendAndRecord(
        conversation.phoneNumber,
        analysis.customerReply,
      );
      await this.messages.markProcessed(conversation.sourceMessageIds);
      return {
        waMessageId: triggeringMessage.waMessageId,
        duplicate: false,
        replySent: true,
        analysisFallback,
      };
    }

    if (!isActiveDistrict(analysis.detectedDistrict)) {
      const reply = analysisFallback
        ? safeFallbackTemplate
        : analysis.customerReply;
      await this.sendAndRecord(conversation.phoneNumber, reply);
      await this.messages.markProcessed(conversation.sourceMessageIds);
      return {
        waMessageId: triggeringMessage.waMessageId,
        duplicate: false,
        replySent: true,
        analysisFallback,
      };
    }

    const status = analysis.needsMoreInfo
      ? 'NEEDS_INFO'
      : 'NEEDS_OPERATOR_REVIEW';
    const serviceType =
      analysis.recommendedServiceType === 'REGULAR_HOUSEHOLD_PICKUP' ||
      analysis.recommendedServiceType === 'ONE_TRIP_TRICYCLE'
        ? analysis.recommendedServiceType
        : 'UNKNOWN';
    const addressText =
      conversation.location?.address ??
      conversation.location?.name ??
      (analysis.addressCompleteness !== 'MISSING'
        ? conversation.text
        : undefined);
    const existing = await this.tickets.findOpenByPhoneNumber(
      conversation.phoneNumber,
    );
    let ticket: PickupRequest;

    if (existing) {
      ticket = await this.tickets.updateIntake(existing.id, {
        district: analysis.detectedDistrict,
        addressText,
        location: conversation.location
          ? {
              lat: conversation.location.lat,
              lng: conversation.location.lng,
            }
          : undefined,
        serviceType,
        volumeLevel: analysis.volumeLevel,
        tricycleLoadEstimate: analysis.tricycleLoadEstimate,
        wasteDescription: analysis.operatorSummary,
        photoUrls: conversation.imageUrls,
        aiAnalysis: analysis,
        status,
      });
    } else {
      ticket = await this.tickets.create({
        idempotencyKey: `wa-conversation:${conversation.sourceMessageIds[0]}`,
        source: 'WHATSAPP',
        customer: {
          phoneNumber: conversation.phoneNumber,
          displayName: conversation.displayName,
          district: analysis.detectedDistrict,
          addressText,
          location: conversation.location
            ? {
                lat: conversation.location.lat,
                lng: conversation.location.lng,
              }
            : undefined,
          createdFrom: 'WHATSAPP',
        },
        district: analysis.detectedDistrict,
        addressText,
        location: conversation.location
          ? {
              lat: conversation.location.lat,
              lng: conversation.location.lng,
            }
          : undefined,
        serviceType,
        volumeLevel: analysis.volumeLevel,
        tricycleLoadEstimate: analysis.tricycleLoadEstimate,
        wasteDescription: analysis.operatorSummary,
        photoUrls: conversation.imageUrls,
        aiAnalysis: analysis,
        initialStatus: status,
      });
    }

    const reply =
      status === 'NEEDS_INFO'
        ? analysis.customerReply
        : ticketCreatedTemplate(ticket.ticketCode, analysis.customerReply);
    await this.sendAndRecord(conversation.phoneNumber, reply, ticket.id);
    await this.messages.markProcessed(conversation.sourceMessageIds, ticket.id);

    return {
      waMessageId: triggeringMessage.waMessageId,
      duplicate: false,
      ticketId: ticket.id,
      replySent: true,
      analysisFallback,
    };
  }

  private async sendAndRecord(
    toPhoneNumber: string,
    text: string,
    relatedTicketId?: string,
  ): Promise<void> {
    const waMessageId = await this.sender.sendText(toPhoneNumber, text);
    await this.messages.saveOutbound({
      waMessageId,
      toPhoneNumber,
      text,
      relatedTicketId,
    });
  }
}
