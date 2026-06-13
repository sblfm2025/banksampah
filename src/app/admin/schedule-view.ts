import type { PickupRequest } from '../../shared/schemas/pickup.schema';

export interface DriverScheduleGroup {
  driverId: string;
  driverName: string;
  tickets: PickupRequest[];
}

export function buildScheduleGroups(
  tickets: PickupRequest[],
  date: string,
): DriverScheduleGroup[] {
  const scheduled = tickets
    .filter((ticket) => ticket.scheduledDate === date)
    .filter((ticket) =>
      ['SCHEDULED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(
        ticket.status,
      ),
    )
    .sort((a, b) =>
      (a.scheduledTimeWindow?.start ?? '99:99').localeCompare(
        b.scheduledTimeWindow?.start ?? '99:99',
      ),
    );

  const groups = new Map<string, DriverScheduleGroup>();
  for (const ticket of scheduled) {
    const driverId = ticket.assignedDriverId ?? 'unassigned';
    const current = groups.get(driverId) ?? {
      driverId,
      driverName: ticket.assignedDriverName ?? 'Belum ada petugas',
      tickets: [],
    };
    current.tickets.push(ticket);
    groups.set(driverId, current);
  }

  return [...groups.values()].sort((a, b) => {
    if (a.driverId === 'unassigned') return -1;
    if (b.driverId === 'unassigned') return 1;
    return a.driverName.localeCompare(b.driverName, 'id-ID');
  });
}
