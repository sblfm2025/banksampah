import { describe, expect, it } from 'vitest';
import { DEMO_TICKETS } from './demo-data';
import { buildScheduleGroups } from './schedule-view';

describe('schedule view', () => {
  it('mengelompokkan pickup berdasarkan petugas dan mengurutkan jam', () => {
    const source = DEMO_TICKETS[2];
    const groups = buildScheduleGroups(
      [
        {
          ...source,
          id: 'late',
          scheduledTimeWindow: { start: '13:00', end: '15:00' },
        },
        {
          ...source,
          id: 'early',
          scheduledTimeWindow: { start: '08:00', end: '10:00' },
        },
      ],
      source.scheduledDate!,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].tickets.map((ticket) => ticket.id)).toEqual([
      'early',
      'late',
    ]);
  });

  it('menempatkan tiket tanpa petugas pada kelompok pertama', () => {
    const source = DEMO_TICKETS[2];
    const groups = buildScheduleGroups(
      [
        source,
        {
          ...source,
          id: 'unassigned',
          status: 'SCHEDULED',
          assignedDriverId: undefined,
          assignedDriverName: undefined,
        },
      ],
      source.scheduledDate!,
    );

    expect(groups[0].driverId).toBe('unassigned');
  });
});
