import type { District } from '../constants/districts';

export type ActiveDistrict = Extract<
  District,
  'WATANG_SAWITTO' | 'PALETEANG'
>;

export interface ServiceDistrict {
  id: ActiveDistrict;
  slug: 'watang-sawitto' | 'paleteang';
  name: string;
  aliases: string[];
  isActive: true;
  sortOrder: number;
}

export interface ServiceVillage {
  id: string;
  districtId: ActiveDistrict;
  name: string;
  aliases: string[];
  isActive: true;
  sortOrder: number;
}

export type LocationSource =
  | 'WHATSAPP_SHARE_LOCATION'
  | 'BROWSER_GPS'
  | 'MANUAL_PIN'
  | 'MANUAL_TEXT'
  | 'OPERATOR_INPUT';

export type LocationValidationStatus =
  | 'INSIDE_SERVICE_AREA'
  | 'OUTSIDE_SERVICE_AREA'
  | 'NEEDS_OPERATOR_REVIEW'
  | 'UNKNOWN';
