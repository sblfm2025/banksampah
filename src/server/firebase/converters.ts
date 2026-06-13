import type {
  DocumentData,
  FirestoreDataConverter,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  Timestamp,
  WithFieldValue,
} from 'firebase-admin/firestore';
import type { Customer } from '../../shared/schemas/customer.schema';
import {
  pickupRequestSchema,
  type PickupRequest,
} from '../../shared/schemas/pickup.schema';

type StoredCustomer = Omit<Customer, 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type StoredPickupRequest = Omit<
  PickupRequest,
  'createdAt' | 'updatedAt' | 'startedAt' | 'completedAt' | 'cancelledAt'
> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
};

function timestampToIso(value: Timestamp | undefined): string | undefined {
  return value?.toDate().toISOString();
}

export const customerConverter: FirestoreDataConverter<Customer> = {
  toFirestore(
    customer: WithFieldValue<Customer> | PartialWithFieldValue<Customer>,
  ): DocumentData {
    return customer as DocumentData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot) {
    const data = snapshot.data() as StoredCustomer;
    return {
      ...data,
      id: snapshot.id,
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
    };
  },
};

export const pickupRequestConverter: FirestoreDataConverter<PickupRequest> = {
  toFirestore(
    pickup:
      | WithFieldValue<PickupRequest>
      | PartialWithFieldValue<PickupRequest>,
  ): DocumentData {
    return pickup as DocumentData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot) {
    const data = snapshot.data() as StoredPickupRequest;
    return pickupRequestSchema.parse({
      ...data,
      id: snapshot.id,
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
      startedAt: timestampToIso(data.startedAt),
      completedAt: timestampToIso(data.completedAt),
      cancelledAt: timestampToIso(data.cancelledAt),
    });
  },
};
