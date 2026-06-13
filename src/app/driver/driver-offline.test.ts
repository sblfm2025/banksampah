import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DriverRepository } from './driver.types';
import {
  enqueueCompletion,
  listPendingCompletions,
  syncPendingCompletions,
} from './driver-offline';

function repository(fails = false): DriverRepository {
  return {
    listToday: vi.fn(),
    getPickup: vi.fn(),
    start: vi.fn(),
    uploadProof: vi.fn(async (_driverId, _ticketId, kind, files) => {
      if (fails) throw new Error('offline');
      return files.map(
        (file: File) => `https://example.com/${kind}/${file.name}`,
      );
    }),
    complete: vi.fn(async () => {
      if (fails) throw new Error('offline');
      return {} as never;
    }),
  };
}

async function addPending() {
  return enqueueCompletion({
    ticketId: 'ticket-offline',
    driverId: 'driver-1',
    actualTripResult: 'COMPLETED_ONE_TRIP',
    beforeFiles: [new File(['foto'], 'before.jpg', { type: 'image/jpeg' })],
    afterFiles: [],
  });
}

afterEach(async () => {
  await syncPendingCompletions(repository());
});

describe('driver offline queue', () => {
  it('menghapus item setelah sinkronisasi berhasil', async () => {
    await addPending();

    const result = await syncPendingCompletions(repository());

    expect(result).toEqual({ completed: 1, failed: 0 });
    expect(await listPendingCompletions()).toHaveLength(0);
  });

  it('mempertahankan item dan menambah attempts ketika sinkronisasi gagal', async () => {
    await addPending();

    const result = await syncPendingCompletions(repository(true));
    const [pending] = await listPendingCompletions();

    expect(result).toEqual({ completed: 0, failed: 1 });
    expect(pending.attempts).toBe(1);
    expect(pending.lastError).toBe('offline');
  });

  it('mengganti antrean lama untuk tiket yang sama', async () => {
    await addPending();
    await enqueueCompletion({
      ticketId: 'ticket-offline',
      driverId: 'driver-1',
      actualTripResult: 'COMPLETED_ONE_TRIP',
      beforeFiles: [],
      afterFiles: [
        new File(['foto-baru'], 'after.jpg', { type: 'image/jpeg' }),
      ],
    });

    const pending = await listPendingCompletions();

    expect(pending).toHaveLength(1);
    expect(pending[0].beforeFiles).toHaveLength(0);
    expect(pending[0].afterFiles).toHaveLength(1);
  });
});
