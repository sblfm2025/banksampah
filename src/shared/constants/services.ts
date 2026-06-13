export const SERVICE_TYPES = [
  'REGULAR_HOUSEHOLD_PICKUP',
  'ONE_TRIP_TRICYCLE',
  'UNKNOWN',
] as const;

export const SERVICE_TYPE_LABELS = {
  REGULAR_HOUSEHOLD_PICKUP: 'Jemput sampah rumah tangga',
  ONE_TRIP_TRICYCLE: 'Angkut 1 kali jalan motor sampah',
  UNKNOWN: 'Belum ditentukan',
} satisfies Record<(typeof SERVICE_TYPES)[number], string>;
