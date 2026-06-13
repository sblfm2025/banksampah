import { openDB, type DBSchema } from 'idb';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import type {
  DriverRepository,
  PendingDriverCompletion,
} from './driver.types';

interface DriverDatabase extends DBSchema {
  cache: {
    key: string;
    value: {
      key: string;
      value: PickupRequest | PickupRequest[];
      updatedAt: string;
    };
  };
  queue: {
    key: string;
    value: PendingDriverCompletion;
  };
}

const database = openDB<DriverDatabase>('sampahta-driver', 1, {
  upgrade(db) {
    db.createObjectStore('cache', { keyPath: 'key' });
    db.createObjectStore('queue', { keyPath: 'id' });
  },
});

export async function cacheToday(
  driverId: string,
  tickets: PickupRequest[],
) {
  const db = await database;
  await db.put('cache', {
    key: `today:${driverId}`,
    value: tickets,
    updatedAt: new Date().toISOString(),
  });
  await Promise.all(tickets.map((ticket) => cachePickup(ticket)));
}

export async function getCachedToday(
  driverId: string,
): Promise<PickupRequest[]> {
  const db = await database;
  const record = await db.get('cache', `today:${driverId}`);
  return Array.isArray(record?.value) ? record.value : [];
}

export async function cachePickup(ticket: PickupRequest) {
  const db = await database;
  await db.put('cache', {
    key: `pickup:${ticket.id}`,
    value: ticket,
    updatedAt: new Date().toISOString(),
  });
}

export async function getCachedPickup(
  id: string,
): Promise<PickupRequest | null> {
  const db = await database;
  const record = await db.get('cache', `pickup:${id}`);
  return record && !Array.isArray(record.value) ? record.value : null;
}

export async function enqueueCompletion(
  input: Omit<PendingDriverCompletion, 'id' | 'createdAt' | 'attempts'>,
) {
  const db = await database;
  const id = `completion:${input.ticketId}`;
  const existing = await db.get('queue', id);
  const item: PendingDriverCompletion = {
    ...input,
    id,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    attempts: existing?.attempts ?? 0,
  };
  await db.put('queue', item);
  return item;
}

export async function listPendingCompletions() {
  const db = await database;
  return db.getAll('queue');
}

export async function syncPendingCompletions(
  repository: DriverRepository,
): Promise<{ completed: number; failed: number }> {
  const db = await database;
  const items = await db.getAll('queue');
  let completed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const [beforePhotoUrls, afterPhotoUrls] = await Promise.all([
        repository.uploadProof(
          item.driverId,
          item.ticketId,
          'before',
          item.beforeFiles,
        ),
        repository.uploadProof(
          item.driverId,
          item.ticketId,
          'after',
          item.afterFiles,
        ),
      ]);
      await repository.complete(item.ticketId, item.driverId, {
        actualTripResult: item.actualTripResult,
        beforePhotoUrls,
        afterPhotoUrls,
        driverNotes: item.driverNotes,
      });
      await db.delete('queue', item.id);
      completed += 1;
    } catch (error) {
      failed += 1;
      await db.put('queue', {
        ...item,
        attempts: item.attempts + 1,
        lastError: error instanceof Error ? error.message : 'Gagal sinkronisasi',
      });
    }
  }

  return { completed, failed };
}
