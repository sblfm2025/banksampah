import type { DocumentData, DocumentSnapshot } from 'firebase/firestore';
import {
  pickupRequestSchema,
  type PickupRequest,
} from '../shared/schemas/pickup.schema';

function toIso(value: unknown): string | undefined {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate().toISOString();
  }
  return typeof value === 'string' ? value : undefined;
}

export function parsePickupSnapshot(
  snapshot: DocumentSnapshot<DocumentData>,
): PickupRequest {
  if (!snapshot.exists()) throw new Error('Permintaan tidak ditemukan.');
  const data = snapshot.data();
  return pickupRequestSchema.parse({
    ...data,
    id: snapshot.id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    startedAt: toIso(data.startedAt),
    completedAt: toIso(data.completedAt),
    cancelledAt: toIso(data.cancelledAt),
  });
}
