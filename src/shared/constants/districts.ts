export const DISTRICTS = [
  'WATANG_SAWITTO',
  'PALETEANG',
  'OUT_OF_AREA',
  'UNKNOWN',
] as const;

export type District = (typeof DISTRICTS)[number];

export const ACTIVE_DISTRICTS = ['WATANG_SAWITTO', 'PALETEANG'] as const;

export const DISTRICT_LABELS: Record<District, string> = {
  WATANG_SAWITTO: 'Watang Sawitto',
  PALETEANG: 'Paleteang',
  OUT_OF_AREA: 'Di luar wilayah',
  UNKNOWN: 'Belum diketahui',
};

export function isActiveDistrict(
  district: District,
): district is (typeof ACTIVE_DISTRICTS)[number] {
  return ACTIVE_DISTRICTS.includes(
    district as (typeof ACTIVE_DISTRICTS)[number],
  );
}
