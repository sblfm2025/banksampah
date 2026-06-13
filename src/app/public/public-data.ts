import type { PickupStatus } from '../../shared/constants/statuses';
import type {
  LocationSource,
  LocationValidationStatus,
} from '../../shared/regions/region.types';

export interface PublicTicket {
  id: string;
  code: string;
  status: PickupStatus;
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

export function listPublicTickets(): PublicTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PublicTicket[]) : [];
  } catch {
    return [];
  }
}

export function savePublicTicket(
  ticket: Omit<PublicTicket, 'id' | 'code' | 'createdAt' | 'status'>,
): PublicTicket {
  const current = listPublicTickets();
  const createdAt = new Date().toISOString();
  const item: PublicTicket = {
    ...ticket,
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
