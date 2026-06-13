import { detectVillage, normalizeRegionText } from './region-normalizer';
import type { ServiceAreaMatch } from './service-area-boundaries';

export interface LocationAddressParts {
  houseNumber?: string;
  road?: string;
  neighbourhood?: string;
  postcode?: string;
}

export function composeServiceAddress(
  parts: LocationAddressParts,
  area: ServiceAreaMatch,
): string {
  const road = [parts.road, parts.houseNumber].filter(Boolean).join(' No. ');
  const neighbourhood =
    parts.neighbourhood &&
    !detectVillage(parts.neighbourhood) &&
    normalizeRegionText(parts.neighbourhood) !==
      normalizeRegionText(area.villageName)
      ? parts.neighbourhood
      : undefined;
  return [
    road,
    neighbourhood,
    `Kelurahan ${area.villageName}`,
    `Kecamatan ${area.districtName}`,
    'Kabupaten Pinrang',
    parts.postcode,
  ]
    .filter(Boolean)
    .join(', ');
}
