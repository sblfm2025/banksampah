export const PICKUP_STATUSES = [
  'NEW',
  'NEEDS_INFO',
  'NEEDS_OPERATOR_REVIEW',
  'CONFIRMED',
  'SCHEDULED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'EXTRA_TRIP_REQUIRED',
  'REJECTED',
  'CANCELLED',
] as const;

export type PickupStatus = (typeof PICKUP_STATUSES)[number];

export const PICKUP_STATUS_LABELS: Record<PickupStatus, string> = {
  NEW: 'Tiket Baru',
  NEEDS_INFO: 'Butuh Data',
  NEEDS_OPERATOR_REVIEW: 'Perlu Dicek',
  CONFIRMED: 'Dikonfirmasi',
  SCHEDULED: 'Dijadwalkan',
  ASSIGNED: 'Petugas Ditugaskan',
  IN_PROGRESS: 'Dalam Penjemputan',
  COMPLETED: 'Selesai',
  EXTRA_TRIP_REQUIRED: 'Butuh Extra Trip',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
};

export const ALLOWED_STATUS_TRANSITIONS: Record<
  PickupStatus,
  readonly PickupStatus[]
> = {
  NEW: [
    'NEEDS_INFO',
    'NEEDS_OPERATOR_REVIEW',
    'CONFIRMED',
    'REJECTED',
    'CANCELLED',
  ],
  NEEDS_INFO: [
    'NEEDS_OPERATOR_REVIEW',
    'CONFIRMED',
    'REJECTED',
    'CANCELLED',
  ],
  NEEDS_OPERATOR_REVIEW: [
    'NEEDS_INFO',
    'CONFIRMED',
    'REJECTED',
    'CANCELLED',
  ],
  CONFIRMED: ['SCHEDULED', 'REJECTED', 'CANCELLED'],
  SCHEDULED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'SCHEDULED', 'CANCELLED'],
  IN_PROGRESS: [
    'ASSIGNED',
    'COMPLETED',
    'EXTRA_TRIP_REQUIRED',
    'CANCELLED',
  ],
  COMPLETED: [],
  EXTRA_TRIP_REQUIRED: ['SCHEDULED', 'ASSIGNED', 'COMPLETED', 'CANCELLED'],
  REJECTED: [],
  CANCELLED: [],
};

export function canTransitionPickupStatus(
  from: PickupStatus,
  to: PickupStatus,
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}
