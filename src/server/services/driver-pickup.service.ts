import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import {
  completePickupInputSchema,
  type CompletePickupInput,
} from '../../shared/schemas/pickup-proof.schema';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import { getOperationalDate } from '../../shared/utils/date';
import { adminDb } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { PickupTicketService } from './pickup-ticket.service';
import { ServiceError } from './service-errors';

export class DriverPickupService {
  private readonly tickets: PickupTicketService;

  constructor(private readonly db: Firestore = adminDb) {
    this.tickets = new PickupTicketService(db);
  }

  async listToday(
    driverId: string,
    now = new Date(),
  ): Promise<PickupRequest[]> {
    const today = getOperationalDate(now);
    const tickets = await this.tickets.list({ date: today, limit: 200 });

    return tickets.filter(
      (ticket) =>
        ticket.assignedDriverId === driverId &&
        ['ASSIGNED', 'IN_PROGRESS', 'EXTRA_TRIP_REQUIRED'].includes(
          ticket.status,
        ),
    );
  }

  async getAssigned(id: string, driverId: string): Promise<PickupRequest> {
    const ticket = await this.tickets.getById(id);
    if (ticket.assignedDriverId !== driverId) {
      throw new ServiceError(
        'VALIDATION_ERROR',
        'Tiket bukan tugas petugas ini.',
      );
    }
    return ticket;
  }

  async start(
    id: string,
    driverId: string,
    now = new Date(),
  ): Promise<PickupRequest> {
    const reference = this.db.collection(COLLECTIONS.pickupRequests).doc(id);

    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        throw new ServiceError('NOT_FOUND', 'Tiket tidak ditemukan.');
      }
      if (snapshot.get('assignedDriverId') !== driverId) {
        throw new ServiceError(
          'VALIDATION_ERROR',
          'Tiket bukan tugas petugas ini.',
        );
      }
      if (snapshot.get('status') !== 'ASSIGNED') {
        throw new ServiceError(
          'INVALID_STATUS_TRANSITION',
          'Pickup hanya dapat dimulai dari status ASSIGNED.',
        );
      }

      const timestamp = Timestamp.fromDate(now);
      const auditReference = this.db.collection(COLLECTIONS.auditLogs).doc();
      transaction.update(reference, {
        status: 'IN_PROGRESS',
        startedAt: timestamp,
        updatedAt: timestamp,
      });
      transaction.set(auditReference, {
        actorId: driverId,
        actorRole: 'DRIVER',
        action: 'PICKUP_STARTED',
        entityType: 'PICKUP_REQUEST',
        entityId: id,
        before: { status: 'ASSIGNED' },
        after: { status: 'IN_PROGRESS' },
        createdAt: timestamp,
      });
    });

    return this.getAssigned(id, driverId);
  }

  async complete(
    id: string,
    driverId: string,
    rawInput: CompletePickupInput,
    now = new Date(),
  ): Promise<PickupRequest> {
    const input = completePickupInputSchema.parse(rawInput);
    const reference = this.db.collection(COLLECTIONS.pickupRequests).doc(id);

    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        throw new ServiceError('NOT_FOUND', 'Tiket tidak ditemukan.');
      }
      if (snapshot.get('assignedDriverId') !== driverId) {
        throw new ServiceError(
          'VALIDATION_ERROR',
          'Tiket bukan tugas petugas ini.',
        );
      }

      const currentStatus = snapshot.get('status');
      if (!['ASSIGNED', 'IN_PROGRESS'].includes(currentStatus)) {
        throw new ServiceError(
          'INVALID_STATUS_TRANSITION',
          'Pickup tidak dapat diselesaikan dari status saat ini.',
        );
      }

      const timestamp = Timestamp.fromDate(now);
      const proofReference = this.db.collection(COLLECTIONS.pickupProofs).doc();
      const auditReference = this.db.collection(COLLECTIONS.auditLogs).doc();
      const nextStatus = this.mapResultToStatus(input.actualTripResult);

      transaction.set(proofReference, {
        pickupRequestId: id,
        driverId,
        beforePhotoUrls: input.beforePhotoUrls,
        afterPhotoUrls: input.afterPhotoUrls,
        actualTripResult: input.actualTripResult,
        driverNotes: input.driverNotes,
        completedAt:
          nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED'
            ? timestamp
            : undefined,
        createdAt: timestamp,
      });
      transaction.update(reference, {
        status: nextStatus,
        driverNotes: input.driverNotes,
        completedAt: nextStatus === 'COMPLETED' ? timestamp : undefined,
        cancelledAt: nextStatus === 'CANCELLED' ? timestamp : undefined,
        updatedAt: timestamp,
      });
      transaction.set(auditReference, {
        actorId: driverId,
        actorRole: 'DRIVER',
        action: 'PICKUP_RESULT_RECORDED',
        entityType: 'PICKUP_REQUEST',
        entityId: id,
        before: { status: currentStatus },
        after: {
          status: nextStatus,
          actualTripResult: input.actualTripResult,
        },
        createdAt: timestamp,
      });
    });

    return this.getAssigned(id, driverId);
  }

  private mapResultToStatus(
    result: CompletePickupInput['actualTripResult'],
  ): PickupRequest['status'] {
    switch (result) {
      case 'COMPLETED_ONE_TRIP':
        return 'COMPLETED';
      case 'PARTIAL_PICKUP':
      case 'EXTRA_TRIP_REQUIRED':
        return 'EXTRA_TRIP_REQUIRED';
      case 'CUSTOMER_NOT_AVAILABLE':
        return 'ASSIGNED';
      case 'CANCELLED_ON_SITE':
        return 'CANCELLED';
    }
  }
}
