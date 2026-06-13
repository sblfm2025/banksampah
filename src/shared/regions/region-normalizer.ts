import { SERVICE_DISTRICTS, SERVICE_VILLAGES } from './service-areas';
import type { ActiveDistrict } from './region.types';

const OUT_OF_AREA_NAMES = [
  'suppa',
  'mattiro bulu',
  'mattirobulu',
  'duampanua',
  'lembang',
  'cempa',
  'patampanua',
  'lanrisang',
  'mattiro sompe',
  'tiroang',
  'batulappa',
];

export function normalizeRegionText(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, ' ');
}

export function detectDistrict(
  input: string,
): ActiveDistrict | 'OUT_OF_AREA' | 'UNKNOWN' {
  const text = normalizeRegionText(input);
  const district = SERVICE_DISTRICTS.find((item) =>
    [item.name, ...item.aliases]
      .map(normalizeRegionText)
      .some((name) => text.includes(name)),
  );
  if (district) return district.id;

  const village = SERVICE_VILLAGES.find((item) =>
    [item.name, ...item.aliases]
      .map(normalizeRegionText)
      .some((name) => text.includes(name)),
  );
  if (village) return village.districtId;

  if (OUT_OF_AREA_NAMES.some((name) => text.includes(name))) {
    return 'OUT_OF_AREA';
  }
  return 'UNKNOWN';
}

export function detectVillage(input: string): string | undefined {
  const text = normalizeRegionText(input);
  return SERVICE_VILLAGES.flatMap((village) =>
    [village.name, ...village.aliases].map((name) => ({
      villageId: village.id,
      name: normalizeRegionText(name),
    })),
  )
    .sort((a, b) => b.name.length - a.name.length)
    .find((candidate) => text.includes(candidate.name))?.villageId;
}
