import type { PickupStatus } from '../../shared/constants/statuses';
import type {
  LocationSource,
  LocationValidationStatus,
} from '../../shared/regions/region.types';

export interface PublicTicket {
  id: string;
  code: string;
  status: PickupStatus;
  customerName?: string;
  customerPhoneNumber?: string;
  address: string;
  district: 'WATANG_SAWITTO' | 'PALETEANG';
  villageId: string;
  location?: { lat: number; lng: number };
  locationAccuracyMeters?: number;
  locationSource: LocationSource;
  locationValidationStatus: LocationValidationStatus;
  volume: 'SMALL' | 'MEDIUM' | 'LARGE' | 'OVERSIZED';
  service: 'REGULAR_HOUSEHOLD_PICKUP' | 'ONE_TRIP_TRICYCLE';
  notes?: string;
  photo?: string;
  createdAt: string;
}

const STORAGE_KEY = 'sampahta-public-tickets';

export function normalizeIndonesianPhoneNumber(value: string): string {
  const digits = value.replaceAll(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function isValidIndonesianPhoneNumber(value: string): boolean {
  return /^628\d{7,12}$/.test(normalizeIndonesianPhoneNumber(value));
}

export function listPublicTickets(): PublicTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PublicTicket[]) : [];
  } catch {
    return [];
  }
}

export function savePublicTicket(
  ticket: Omit<
    PublicTicket,
    'id' | 'code' | 'createdAt' | 'status' | 'customerName' | 'customerPhoneNumber'
  > & {
    customerName: string;
    customerPhoneNumber: string;
  },
): PublicTicket {
  const current = listPublicTickets();
  const createdAt = new Date().toISOString();
  const item: PublicTicket = {
    ...ticket,
    customerName: ticket.customerName.trim(),
    customerPhoneNumber: normalizeIndonesianPhoneNumber(
      ticket.customerPhoneNumber,
    ),
    id: crypto.randomUUID(),
    code: `DRAFT-${new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date(createdAt))
      .replaceAll('-', '')}-${String(current.length + 1).padStart(3, '0')}`,
    status: 'NEW',
    createdAt,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...current]));
  return item;
}

export function getPublicTicket(id: string): PublicTicket | undefined {
  return listPublicTickets().find((ticket) => ticket.id === id);
}
