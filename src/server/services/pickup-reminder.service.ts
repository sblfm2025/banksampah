import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import {
  addOperationalDays,
  getOperationalDate,
} from '../../shared/utils/date';
import { stableIdentifier } from '../../shared/utils/identifiers';
import { adminDb } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { pickupRequestConverter } from '../firebase/converters';
import type { WhatsAppMessageService } from '../whatsapp/message.service';
import type { WhatsAppTemplateSender } from '../whatsapp/whatsapp.client';
import { AuditLogService } from './audit-log.service';

const LEASE_MS = 5 * 60 * 1000;

type OutboundStore = Pick<WhatsAppMessageService, 'saveOutbound'>;

export interface PickupReminderResult {
  targetDate: string;
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
}

export class PickupReminderService {
  constructor(
    private readonly sender: WhatsAppTemplateSender,
    private readonly messages: OutboundStore,
    private readonly db: Firestore = adminDb,
    private readonly audit = new AuditLogService(db),
    private readonly templateName = 'pickup_schedule_reminder',
    private readonly languageCode = 'id',
  ) {}

  async run(now = new Date()): Promise<PickupReminderResult> {
    const targetDate = addOperationalDays(getOperationalDate(now), 1);
    const snapshot = await this.db
      .collection(COLLECTIONS.pickupRequests)
      .withConverter(pickupRequestConverter)
      .where('scheduledDate', '==', targetDate)
      .get();
    const tickets = snapshot.docs
      .map((document) => document.data())
      .filter(
        (ticket) =>
          ticket.status === 'ASSIGNED' &&
          Boolean(ticket.assignedDriverId && ticket.assignedDriverName),
      );
    const result: PickupReminderResult = {
      targetDate,
      candidates: tickets.length,
      sent: 0,
      skipped: 0,
      failed: 0,
    };

    for (const ticket of tickets) {
      const claimed = await this.claim(ticket.id, targetDate, now);
      if (!claimed) {
        result.skipped += 1;
        continue;
      }

      try {
        const timeWindow = ticket.scheduledTimeWindow
          ? `${ticket.scheduledTimeWindow.start}-${ticket.scheduledTimeWindow.end}`
          : 'sesuai konfirmasi operator';
        const waMessageId = await this.sender.sendTemplate(
          ticket.customerPhoneNumber,
          this.templateName,
          this.languageCode,
          [
            ticket.ticketCode,
            targetDate,
            timeWindow,
            ticket.assignedDriverName!,
          ],
        );
        await this.messages.saveOutbound({
          waMessageId,
          toPhoneNumber: ticket.customerPhoneNumber,
          text: `[TEMPLATE:${this.templateName}] ${ticket.ticketCode} ${targetDate} ${timeWindow}`,
          relatedTicketId: ticket.id,
        });
        await this.markSent(ticket.id, targetDate, waMessageId, now);
        await this.audit.write({
          action: 'PICKUP_REMINDER_SENT',
          entityType: 'PICKUP_REQUEST',
          entityId: ticket.id,
          after: { targetDate, templateName: this.templateName },
        });
        result.sent += 1;
      } catch (error) {
        await this.markFailed(ticket.id, targetDate, error, now);
        result.failed += 1;
      }
    }

    return result;
  }

  private async deliveryId(ticketId: string, targetDate: string) {
    return stableIdentifier(
      'reminder',
      `${ticketId}:${targetDate}:${this.templateName}`,
    );
  }

  private async claim(ticketId: string, targetDate: string, now: Date) {
    const id = await this.deliveryId(ticketId, targetDate);
    const reference = this.db
      .collection(COLLECTIONS.reminderDeliveries)
      .doc(id);

    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const leaseUntil = snapshot.get('leaseUntil') as Timestamp | undefined;
      if (
        snapshot.get('status') === 'SENT' ||
        (snapshot.get('status') === 'PROCESSING' &&
          leaseUntil &&
          leaseUntil.toMillis() > now.getTime())
      ) {
        return false;
      }

      transaction.set(
        reference,
        {
          ticketId,
          targetDate,
          templateName: this.templateName,
          status: 'PROCESSING',
          attempts: (snapshot.get('attempts') ?? 0) + 1,
          leaseUntil: Timestamp.fromMillis(now.getTime() + LEASE_MS),
          updatedAt: Timestamp.fromDate(now),
          createdAt: snapshot.get('createdAt') ?? Timestamp.fromDate(now),
        },
        { merge: true },
      );
      return true;
    });
  }

  private async markSent(
    ticketId: string,
    targetDate: string,
    waMessageId: string | undefined,
    now: Date,
  ) {
    const id = await this.deliveryId(ticketId, targetDate);
    await this.db.collection(COLLECTIONS.reminderDeliveries).doc(id).update({
      status: 'SENT',
      waMessageId,
      sentAt: Timestamp.fromDate(now),
      leaseUntil: null,
      updatedAt: Timestamp.fromDate(now),
    });
  }

  private async markFailed(
    ticketId: string,
    targetDate: string,
    error: unknown,
    now: Date,
  ) {
    const id = await this.deliveryId(ticketId, targetDate);
    await this.db.collection(COLLECTIONS.reminderDeliveries).doc(id).update({
      status: 'FAILED',
      errorName: error instanceof Error ? error.name : 'UnknownError',
      leaseUntil: null,
      updatedAt: Timestamp.fromDate(now),
    });
  }
}
