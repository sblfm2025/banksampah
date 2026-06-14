import { describe, expect, it } from 'vitest';
import { canTransitionPickupStatus } from './statuses';

describe('canTransitionPickupStatus', () => {
  it('mengizinkan alur penugasan normal', () => {
    expect(canTransitionPickupStatus('CONFIRMED', 'SCHEDULED')).toBe(true);
    expect(canTransitionPickupStatus('SCHEDULED', 'ASSIGNED')).toBe(true);
    expect(canTransitionPickupStatus('ASSIGNED', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionPickupStatus('IN_PROGRESS', 'COMPLETED')).toBe(true);
  });

  it('melarang status terminal dibuka kembali', () => {
    expect(canTransitionPickupStatus('COMPLETED', 'IN_PROGRESS')).toBe(false);
    expect(canTransitionPickupStatus('REJECTED', 'NEW')).toBe(false);
    expect(canTransitionPickupStatus('CANCELLED', 'NEW')).toBe(false);
  });

  it('melarang permintaan baru langsung selesai', () => {
    expect(canTransitionPickupStatus('NEW', 'COMPLETED')).toBe(false);
  });
});
