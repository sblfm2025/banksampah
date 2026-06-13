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
  deliveryStatus: 'PENDING_SYNC' | 'SUBMITTED';
  remoteId?: string;
  lastSyncError?: string;
  createdAt: string;
}

const STORAGE_KEY = 'sampahta-public-tickets';
const PROFILE_STORAGE_KEY = 'sampahta-public-profile';

export interface PublicProfile {
  fullName: string;
  phoneNumber: string;
  address: string;
  district?: 'WATANG_SAWITTO' | 'PALETEANG';
  villageId?: string;
  location?: { lat: number; lng: number };
  locationAccuracyMeters?: number;
  locationSource?: LocationSource;
  locationValidationStatus?: LocationValidationStatus;
  updatedAt: string;
}

export function normalizeIndonesianPhoneNumber(value: string): string {
  const digits = value.replaceAll(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function isValidIndonesianPhoneNumber(value: string): boolean {
  return /^628\d{7,12}$/.test(normalizeIndonesianPhoneNumber(value));
}

export function getPublicProfile(): PublicProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as Partial<PublicProfile>;
    if (
      typeof profile.fullName !== 'string' ||
      typeof profile.phoneNumber !== 'string' ||
      typeof profile.address !== 'string'
    ) {
      return null;
    }
    return {
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      address: profile.address,
      district: profile.district,
      villageId: profile.villageId,
      location: profile.location,
      locationAccuracyMeters: profile.locationAccuracyMeters,
      locationSource: profile.locationSource,
      locationValidationStatus: profile.locationValidationStatus,
      updatedAt:
        typeof profile.updatedAt === 'string'
          ? profile.updatedAt
          : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function savePublicProfile(
  profile: Omit<PublicProfile, 'updatedAt'>,
): PublicProfile {
  const item: PublicProfile = {
    ...profile,
    fullName: profile.fullName.trim(),
    phoneNumber: normalizeIndonesianPhoneNumber(profile.phoneNumber),
    address: profile.address.trim(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(item));
  return item;
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
    | 'id'
    | 'code'
    | 'createdAt'
    | 'status'
    | 'customerName'
    | 'customerPhoneNumber'
    | 'deliveryStatus'
    | 'remoteId'
    | 'lastSyncError'
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
    deliveryStatus: 'PENDING_SYNC',
    createdAt,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...current]));
  savePublicProfile({
    fullName: item.customerName ?? '',
    phoneNumber: item.customerPhoneNumber ?? '',
    address: item.address,
    district: item.district,
    villageId: item.villageId,
    location: item.location,
    locationAccuracyMeters: item.locationAccuracyMeters,
    locationSource: item.locationSource,
    locationValidationStatus: item.locationValidationStatus,
  });
  return item;
}

export function getPublicTicket(id: string): PublicTicket | undefined {
  return listPublicTickets().find((ticket) => ticket.id === id);
}

export function updatePublicTicket(
  id: string,
  updates: Partial<PublicTicket>,
): PublicTicket | undefined {
  const current = listPublicTickets();
  const existing = current.find((ticket) => ticket.id === id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      current.map((ticket) => (ticket.id === id ? updated : ticket)),
    ),
  );
  return updated;
}
