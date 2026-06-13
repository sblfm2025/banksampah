import {
  Timestamp,
  type DocumentData,
  type Firestore,
} from 'firebase-admin/firestore';
import type { ParsedWhatsAppMessage } from '../../shared/schemas/whatsapp.schema';
import { stableIdentifier } from '../../shared/utils/identifiers';
import { adminDb } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';

export interface StoredWhatsAppMessage extends ParsedWhatsAppMessage {
  id: string;
  direction: 'INBOUND';
  mediaUrl?: string;
  processed: boolean;
  relatedTicketId?: string;
}

function fromDocument(id: string, data: DocumentData): StoredWhatsAppMessage {
  return {
    id,
    direction: 'INBOUND',
    waMessageId: data.waMessageId,
    fromPhoneNumber: data.fromPhoneNumber,
    customerDisplayName: data.customerDisplayName,
    messageType: data.messageType,
    text: data.text,
    mediaId: data.mediaId,
    mediaMimeType: data.mediaMimeType,
    mediaUrl: data.mediaUrl,
    location: data.location,
    occurredAt: data.occurredAt.toDate(),
    rawPayload: data.rawPayload,
    processed: data.processed,
    relatedTicketId: data.relatedTicketId,
  };
}

export class WhatsAppMessageService {
  constructor(private readonly db: Firestore = adminDb) {}

  async saveInbound(
    message: ParsedWhatsAppMessage,
  ): Promise<{ message: StoredWhatsAppMessage; isNew: boolean }> {
    const id = await stableIdentifier('wamid', message.waMessageId);
    const reference = this.db.collection(COLLECTIONS.whatsappMessages).doc(id);
    let isNew = false;

    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) {
        return;
      }

      isNew = true;
      transaction.create(reference, {
        ...message,
        direction: 'INBOUND',
        occurredAt: Timestamp.fromDate(message.occurredAt),
        createdAt: Timestamp.now(),
        processed: false,
      });
    });

    const snapshot = await reference.get();
    return { message: fromDocument(snapshot.id, snapshot.data()!), isNew };
  }

  async attachMedia(id: string, mediaUrl: string): Promise<void> {
    await this.db.collection(COLLECTIONS.whatsappMessages).doc(id).update({
      mediaUrl,
      updatedAt: Timestamp.now(),
    });
  }

  async listRecent(
    phoneNumber: string,
    since: Date,
  ): Promise<StoredWhatsAppMessage[]> {
    const snapshot = await this.db
      .collection(COLLECTIONS.whatsappMessages)
      .where('fromPhoneNumber', '==', phoneNumber)
      .where('direction', '==', 'INBOUND')
      .where('occurredAt', '>=', Timestamp.fromDate(since))
      .orderBy('occurredAt', 'asc')
      .get();

    return snapshot.docs.map((document) =>
      fromDocument(document.id, document.data()),
    );
  }

  async markProcessed(
    ids: string[],
    relatedTicketId?: string,
  ): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const batch = this.db.batch();
    for (const id of ids) {
      batch.update(this.db.collection(COLLECTIONS.whatsappMessages).doc(id), {
        processed: true,
        relatedTicketId,
        updatedAt: Timestamp.now(),
      });
    }
    await batch.commit();
  }

  async saveOutbound(input: {
    waMessageId?: string;
    toPhoneNumber: string;
    text: string;
    relatedTicketId?: string;
  }): Promise<string> {
    const seed =
      input.waMessageId ??
      `${input.toPhoneNumber}:${Date.now()}:${input.text.slice(0, 32)}`;
    const id = await stableIdentifier('waout', seed);

    await this.db.collection(COLLECTIONS.whatsappMessages).doc(id).set({
      waMessageId: input.waMessageId ?? id,
      fromPhoneNumber: input.toPhoneNumber,
      direction: 'OUTBOUND',
      messageType: 'TEXT',
      text: input.text,
      processed: true,
      relatedTicketId: input.relatedTicketId,
      occurredAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    });

    return id;
  }
}
