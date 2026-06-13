import { z } from 'zod';
import type {
  ActiveDistrict,
  LocationSource,
  LocationValidationStatus,
} from '../regions/region.types';

export const userRoleSchema = z.enum([
  'SUPER_ADMIN',
  'OPERATOR',
  'DRIVER',
  'CUSTOMER',
]);

export const appUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phoneNumber: z.string().optional(),
  email: z.email().optional(),
  role: userRoleSchema,
  isActive: z.boolean(),
  addressText: z.string().optional(),
  district: z.enum(['WATANG_SAWITTO', 'PALETEANG']).optional(),
  villageId: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  locationAccuracyMeters: z.number().optional(),
  locationSource: z
    .enum(['BROWSER_GPS', 'MANUAL_PIN', 'MANUAL_TEXT'])
    .optional(),
  locationValidationStatus: z
    .enum([
      'INSIDE_SERVICE_AREA',
      'OUTSIDE_SERVICE_AREA',
      'NEEDS_OPERATOR_REVIEW',
      'UNKNOWN',
    ])
    .optional(),
});

export type AppUser = z.infer<typeof appUserSchema>;

export interface CustomerProfileInput {
  fullName: string;
  phoneNumber: string;
  address: string;
  district: ActiveDistrict;
  villageId: string;
  location: { lat: number; lng: number };
  locationAccuracyMeters?: number;
  locationSource: Extract<LocationSource, 'BROWSER_GPS' | 'MANUAL_PIN'>;
  locationValidationStatus: LocationValidationStatus;
}

export function isCustomerProfileComplete(user: AppUser | null): boolean {
  return Boolean(
    user?.role === 'CUSTOMER' &&
      user.isActive &&
      user.name.trim().length >= 2 &&
      user.phoneNumber &&
      /^628\d{7,12}$/.test(user.phoneNumber) &&
      user.addressText &&
      user.addressText.trim().length >= 8 &&
      user.district &&
      user.villageId &&
      user.location &&
      user.locationValidationStatus === 'INSIDE_SERVICE_AREA',
  );
}
