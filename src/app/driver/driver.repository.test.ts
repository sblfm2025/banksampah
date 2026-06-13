import { describe, expect, it } from 'vitest';
import {
  DemoDriverRepository,
  proofStorageEnabled,
} from './driver.repository';

describe('DemoDriverRepository', () => {
  it('mengaktifkan bukti foto pada mode demo', () => {
    expect(proofStorageEnabled).toBe(true);
  });

  it('hanya menampilkan pickup milik driver yang sedang bertugas', async () => {
    const repository = new DemoDriverRepository();

    const pickups = await repository.listToday('driver-1');

    expect(pickups.length).toBeGreaterThan(0);
    expect(pickups.every((ticket) => ticket.assignedDriverId === 'driver-1')).toBe(
      true,
    );
  });

  it('menolak akses driver lain ke detail pickup', async () => {
    const repository = new DemoDriverRepository();
    const [pickup] = await repository.listToday('driver-1');

    await expect(
      repository.getPickup(pickup.id, 'driver-lain'),
    ).rejects.toThrow('Pickup tidak ditemukan.');
  });

  it('memulai dan menyelesaikan pickup dengan bukti foto', async () => {
    const repository = new DemoDriverRepository();
    const [pickup] = await repository.listToday('driver-1');
    const started = await repository.start(pickup.id, 'driver-1');
    const completed = await repository.complete(pickup.id, 'driver-1', {
      actualTripResult: 'COMPLETED_ONE_TRIP',
      beforePhotoUrls: ['https://example.com/before.jpg'],
      afterPhotoUrls: [],
    });

    expect(started.status).toBe('IN_PROGRESS');
    expect(started.startedAt).toBeDefined();
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeDefined();
  });
});
