import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type Firestore,
} from 'firebase-admin/firestore';
import type { AuditActor } from '../../shared/schemas/audit.schema';
import {
  assignDriverInputSchema,
  createPickupRequestInputSchema,
  schedulePickupInputSchema,
  updatePickupIntakeInputSchema,
  updatePickupStatusInputSchema,
  type AssignDriverInput,
  type CreatePickupRequestInput,
  type SchedulePickupInput,
  type UpdatePickupIntakeInput,
  type UpdatePickupStatusInput,
} from '../../shared/schemas/pickup-input.schema';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import type { District } from '../../shared/constants/districts';
import { isActiveDistrict } from '../../shared/constants/districts';
import {
  canTransitionPickupStatus,
  type PickupStatus,
} from '../../shared/constants/statuses';
import {
  getOperationalDate,
  toTicketDateSegment,
} from '../../shared/utils/date';
import {
  formatTicketCode,
  stableIdentifier,
} from '../../shared/utils/identifiers';
import { adminDb } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { pickupRequestConverter } from '../firebase/converters';
import { ServiceError } from './service-errors';

interface StoredIdempotencyKey {
  entityId: string;
  entityType: 'PICKUP_REQUEST';
}

export class PickupTicketService {
  constructor(private readonly db: Firestore = adminDb) {}

  async create(
    rawInput: CreatePickupRequestInput,
    actor: AuditActor = { role: 'SYSTEM' },
    now = new Date(),
  ): Promise<PickupRequest> {
    const input = createPickupRequestInputSchema.parse(rawInput);

    if (!isActiveDistrict(input.district)) {
      throw new ServiceError(
        'VALIDATION_ERROR',
        'Tiket aktif hanya dapat dibuat untuk kecamatan pilot.',
      );
    }

    const operationalDate = getOperationalDate(now);
    const dateSegment = toTicketDateSegment(operationalDate);
    const customerId = await stableIdentifier(
      'wa',
      input.customer.phoneNumber,
    );
    const idempotencyId = await stableIdentifier(
      'idem',
      input.idempotencyKey,
    );

    const ticketReference = this.db
      .collection(COLLECTIONS.pickupRequests)
      .doc();
    const idempotencyReference = this.db
      .collection(COLLECTIONS.idempotencyKeys)
      .doc(idempotencyId);
    const counterReference = this.db
      .collection(COLLECTIONS.ticketCounters)
      .doc(dateSegment);
    const customerReference = this.db
      .collection(COLLECTIONS.customers)
      .doc(customerId);

    const ticketId = await this.db.runTransaction(
      async (transaction) => {
        const idempotencySnapshot =
          await transaction.get(idempotencyReference);
        if (idempotencySnapshot.exists) {
          const existing = idempotencySnapshot.data() as StoredIdempotencyKey;
          return existing.entityId;
        }

        const counterSnapshot = await transaction.get(counterReference);
        const customerSnapshot = await transaction.get(customerReference);

        const sequence = (counterSnapshot.get('lastSequence') ?? 0) + 1;
        const ticketCode = formatTicketCode(dateSegment, sequence);
        const timestamp = Timestamp.fromDate(now);
        const analysisReference = input.aiAnalysis
          ? this.db.collection(COLLECTIONS.aiAnalyses).doc()
          : null;
        const auditReference = this.db.collection(COLLECTIONS.auditLogs).doc();

        transaction.set(
          customerReference,
          {
            ...input.customer,
            id: customerId,
            createdAt: customerSnapshot.exists
              ? customerSnapshot.get('createdAt')
              : timestamp,
            updatedAt: timestamp,
          },
          { merge: true },
        );

        transaction.set(counterReference, {
          date: operationalDate,
          lastSequence: sequence,
          updatedAt: timestamp,
        });

        if (analysisReference && input.aiAnalysis) {
          transaction.set(analysisReference, {
            ...input.aiAnalysis,
            pickupRequestId: ticketReference.id,
            createdAt: timestamp,
          });
        }

        transaction.set(ticketReference, {
          id: ticketReference.id,
          ticketCode,
          source: input.source,
          customerId,
          customerPhoneNumber: input.customer.phoneNumber,
          customerName: input.customer.fullName ?? input.customer.displayName,
          district: input.district,
          village: input.village,
          addressText: input.addressText,
          location: input.location,
          serviceType: input.serviceType,
          volumeLevel: input.volumeLevel,
          tricycleLoadEstimate: input.tricycleLoadEstimate,
          wasteDescription: input.wasteDescription,
          photoUrls: input.photoUrls,
          aiAnalysis: input.aiAnalysis,
          aiAnalysisId: analysisReference?.id,
          status: input.initialStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        transaction.set(idempotencyReference, {
          key: input.idempotencyKey,
          entityId: ticketReference.id,
          entityType: 'PICKUP_REQUEST',
          createdAt: timestamp,
        });

        transaction.set(auditReference, {
          actorId: actor.id,
          actorRole: actor.role,
          action: 'PICKUP_REQUEST_CREATED',
          entityType: 'PICKUP_REQUEST',
          entityId: ticketReference.id,
          after: {
            ticketCode,
            status: input.initialStatus,
            district: input.district,
          },
          createdAt: timestamp,
        });

        return ticketReference.id;
      },
      { maxAttempts: 10 },
    );

    return this.getById(ticketId);
  }

  async getById(id: string): Promise<PickupRequest> {
    const snapshot = await this.db
      .collection(COLLECTIONS.pickupRequests)
      .doc(id)
      .withConverter(pickupRequestConverter)
      .get();
    const pickup = snapshot.data();

    if (!pickup) {
      throw new ServiceError('NOT_FOUND', 'Tiket tidak ditemukan.');
    }

    return pickup;
  }

  async list(filters: {
    status?: PickupStatus;
    district?: District;
    serviceType?: PickupRequest['serviceType'];
    volumeLevel?: PickupRequest['volumeLevel'];
    date?: string;
    query?: string;
    limit?: number;
  } = {}): Promise<PickupRequest[]> {
    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);
    const snapshot = await this.db
      .collection(COLLECTIONS.pickupRequests)
      .withConverter(pickupRequestConverter)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    const query = filters.query?.trim().toLocaleLowerCase('id-ID');

    return snapshot.docs
      .map((document) => document.data())
      .filter((ticket) => !filters.status || ticket.status === filters.status)
      .filter(
        (ticket) => !filters.district || ticket.district === filters.district,
      )
      .filter(
        (ticket) =>
          !filters.serviceType || ticket.serviceType === filters.serviceType,
      )
      .filter(
        (ticket) =>
          !filters.volumeLevel || ticket.volumeLevel === filters.volumeLevel,
      )
      .filter(
        (ticket) =>
          !filters.date ||
          ticket.scheduledDate === filters.date ||
          ticket.createdAt.startsWith(filters.date),
      )
      .filter((ticket) => {
        if (!query) return true;
        return [
          ticket.ticketCode,
          ticket.customerName,
          ticket.customerPhoneNumber,
        ]
          .filter(Boolean)
          .some((value) =>
            value!.toLocaleLowerCase('id-ID').includes(query),
          );
      });
  }

  async findOpenByPhoneNumber(
    phoneNumber: string,
  ): Promise<PickupRequest | null> {
    const snapshot = await this.db
      .collection(COLLECTIONS.pickupRequests)
      .where('customerPhoneNumber', '==', phoneNumber)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    const openStatuses = new Set([
      'NEW',
      'NEEDS_INFO',
      'NEEDS_OPERATOR_REVIEW',
    ]);
    const document = snapshot.docs.find((item) =>
      openStatuses.has(item.get('status')),
    );

    if (!document) {
      return null;
    }

    return this.getById(document.id);
  }

  async updateIntake(
    id: string,
    rawInput: UpdatePickupIntakeInput,
    now = new Date(),
  ): Promise<PickupRequest> {
    const input = updatePickupIntakeInputSchema.parse(rawInput);
    const reference = this.db.collection(COLLECTIONS.pickupRequests).doc(id);

    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        throw new ServiceError('NOT_FOUND', 'Tiket tidak ditemukan.');
      }

      const currentStatus = snapshot.get('status') as PickupStatus;
      if (!['NEW', 'NEEDS_INFO', 'NEEDS_OPERATOR_REVIEW'].includes(currentStatus)) {
        throw new ServiceError(
          'CONFLICT',
          'Tiket tidak lagi menerima pembaruan intake.',
        );
      }

      const timestamp = Timestamp.fromDate(now);
      const analysisReference = this.db.collection(COLLECTIONS.aiAnalyses).doc();
      const auditReference = this.db.collection(COLLECTIONS.auditLogs).doc();

      transaction.set(analysisReference, {
        ...input.aiAnalysis,
        pickupRequestId: id,
        createdAt: timestamp,
      });
      transaction.update(reference, {
        district: input.district,
        addressText: input.addressText,
        location: input.location,
        serviceType: input.serviceType,
        volumeLevel: input.volumeLevel,
        tricycleLoadEstimate: input.tricycleLoadEstimate,
        wasteDescription: input.wasteDescription,
        photoUrls: input.photoUrls,
        aiAnalysis: input.aiAnalysis,
        aiAnalysisId: analysisReference.id,
        status: input.status,
        updatedAt: timestamp,
      });
      transaction.set(auditReference, {
        actorRole: 'SYSTEM',
        action: 'PICKUP_INTAKE_UPDATED',
        entityType: 'PICKUP_REQUEST',
        entityId: id,
        before: { status: currentStatus },
        after: { status: input.status },
        createdAt: timestamp,
      });
    });

    return this.getById(id);
  }

  async updateStatus(
    id: string,
    rawInput: UpdatePickupStatusInput,
    actor: AuditActor,
    now = new Date(),
  ): Promise<PickupRequest> {
    const input = updatePickupStatusInputSchema.parse(rawInput);
    const ticketReference = this.db
      .collection(COLLECTIONS.pickupRequests)
      .doc(id);

    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ticketReference);
      if (!snapshot.exists) {
        throw new ServiceError('NOT_FOUND', 'Tiket tidak ditemukan.');
      }

      const currentStatus = snapshot.get('status') as PickupStatus;
      if (!canTransitionPickupStatus(currentStatus, input.status)) {
        throw new ServiceError(
          'INVALID_STATUS_TRANSITION',
          `Status ${currentStatus} tidak dapat diubah menjadi ${input.status}.`,
        );
      }

      if (input.status === 'REJECTED' && !input.rejectedReason) {
        throw new ServiceError(
          'VALIDATION_ERROR',
          'Alasan penolakan wajib diisi.',
        );
      }

      const timestamp = Timestamp.fromDate(now);
      const auditReference = this.db.collection(COLLECTIONS.auditLogs).doc();
      const updates: DocumentData = {
        status: input.status,
        updatedAt: timestamp,
      };

      if (input.notes) {
        updates.operatorNotes = input.notes;
      }
      if (input.rejectedReason) {
        updates.rejectedReason = input.rejectedReason;
      }
      if (input.status === 'COMPLETED') {
        updates.completedAt = timestamp;
      }
      if (input.status === 'CANCELLED') {
        updates.cancelledAt = timestamp;
      }
      if (input.status !== 'REJECTED') {
        updates.rejectedReason = FieldValue.delete();
      }

      transaction.update(ticketReference, updates);
      transaction.set(auditReference, {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'PICKUP_STATUS_CHANGED',
        entityType: 'PICKUP_REQUEST',
        entityId: id,
        before: { status: currentStatus },
        after: { status: input.status, notes: input.notes },
        createdAt: timestamp,
      });
    });

    return this.getById(id);
  }

  async schedule(
    id: string,
    rawInput: SchedulePickupInput,
    actor: AuditActor,
    now = new Date(),
  ): Promise<PickupRequest> {
    const input = schedulePickupInputSchema.parse(rawInput);
    const reference = this.db.collection(COLLECTIONS.pickupRequests).doc(id);

    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        throw new ServiceError('NOT_FOUND', 'Tiket tidak ditemukan.');
      }

      const currentStatus = snapshot.get('status') as PickupStatus;
      if (currentStatus !== 'CONFIRMED') {
        throw new ServiceError(
          'INVALID_STATUS_TRANSITION',
          'Hanya tiket yang sudah dikonfirmasi dapat dijadwalkan.',
        );
      }

      const timestamp = Timestamp.fromDate(now);
      const auditReference = this.db.collection(COLLECTIONS.auditLogs).doc();
      transaction.update(reference, {
        status: 'SCHEDULED',
        scheduledDate: input.scheduledDate,
        scheduledTimeWindow: input.scheduledTimeWindow,
        operatorNotes: input.operatorNotes,
        updatedAt: timestamp,
      });
      transaction.set(auditReference, {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'PICKUP_SCHEDULED',
        entityType: 'PICKUP_REQUEST',
        entityId: id,
        before: { status: currentStatus },
        after: {
          status: 'SCHEDULED',
          scheduledDate: input.scheduledDate,
          scheduledTimeWindow: input.scheduledTimeWindow,
        },
        createdAt: timestamp,
      });
    });

    return this.getById(id);
  }

  async assignDriver(
    id: string,
    rawInput: AssignDriverInput,
    actor: AuditActor,
    now = new Date(),
  ): Promise<PickupRequest> {
    const input = assignDriverInputSchema.parse(rawInput);
    const reference = this.db.collection(COLLECTIONS.pickupRequests).doc(id);

    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        throw new ServiceError('NOT_FOUND', 'Tiket tidak ditemukan.');
      }

      const currentStatus = snapshot.get('status') as PickupStatus;
      if (currentStatus !== 'SCHEDULED') {
        throw new ServiceError(
          'INVALID_STATUS_TRANSITION',
          'Hanya tiket terjadwal yang dapat ditugaskan.',
        );
      }

      const timestamp = Timestamp.fromDate(now);
      const auditReference = this.db.collection(COLLECTIONS.auditLogs).doc();
      transaction.update(reference, {
        status: 'ASSIGNED',
        assignedDriverId: input.driverId,
        assignedDriverName: input.driverName,
        updatedAt: timestamp,
      });
      transaction.set(auditReference, {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'PICKUP_DRIVER_ASSIGNED',
        entityType: 'PICKUP_REQUEST',
        entityId: id,
        before: { status: currentStatus },
        after: {
          status: 'ASSIGNED',
          assignedDriverId: input.driverId,
          assignedDriverName: input.driverName,
        },
        createdAt: timestamp,
      });
    });

    return this.getById(id);
  }
}
