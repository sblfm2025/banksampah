import { detectDistrict, detectVillage } from '../../../shared/regions/region-normalizer';
import { getVillage } from '../../../shared/regions/service-areas';
import type { ActiveDistrict } from '../../../shared/regions/region.types';

const DEFAULT_ENDPOINT = 'https://nominatim.openstreetmap.org';
const CACHE_KEY = 'sampahta-reverse-geocoding-v2';
const MIN_REQUEST_INTERVAL_MS = 1_100;

let lastRequestAt = 0;
let requestQueue = Promise.resolve();

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  hamlet?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimReverseResponse {
  display_name?: string;
  address?: NominatimAddress;
}

export interface ReverseGeocodingResult {
  address: string;
  addressParts: {
    houseNumber?: string;
    road?: string;
    neighbourhood?: string;
    postcode?: string;
  };
  district?: ActiveDistrict;
  villageId?: string;
  rawRegionText: string;
}

function coordinateKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

function readCache(): Record<string, ReverseGeocodingResult> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<
      string,
      ReverseGeocodingResult
    >;
  } catch {
    return {};
  }
}

function writeCache(key: string, result: ReverseGeocodingResult): void {
  try {
    const cache = readCache();
    cache[key] = result;
    const entries = Object.entries(cache).slice(-100);
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Reverse geocoding remains usable when storage is unavailable.
  }
}

function formatAddress(data: NominatimReverseResponse): string {
  const address = data.address ?? {};
  const concise = [
    address.road ?? address.pedestrian,
    address.neighbourhood,
    address.village ?? address.suburb,
    address.city ?? address.town ?? address.municipality,
    address.postcode,
  ].filter(Boolean);
  return concise.length >= 2
    ? [...new Set(concise)].join(', ')
    : data.display_name ?? concise.join(', ');
}

function parseResult(data: NominatimReverseResponse): ReverseGeocodingResult {
  const sourceAddress = data.address ?? {};
  const rawRegionText = [
    data.display_name,
    ...Object.values(data.address ?? {}),
  ]
    .filter(Boolean)
    .join(' ');
  const detectedDistrict = detectDistrict(rawRegionText);
  const villageId = detectVillage(rawRegionText);
  const villageDistrict = villageId
    ? getVillage(villageId)?.districtId
    : undefined;
  return {
    address: formatAddress(data),
    addressParts: {
      houseNumber: sourceAddress.house_number,
      road: sourceAddress.road ?? sourceAddress.pedestrian,
      neighbourhood: sourceAddress.neighbourhood ?? sourceAddress.hamlet,
      postcode: sourceAddress.postcode,
    },
    district:
      detectedDistrict === 'WATANG_SAWITTO' ||
      detectedDistrict === 'PALETEANG'
        ? detectedDistrict
        : villageDistrict,
    villageId,
    rawRegionText,
  };
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodingResult> {
  const key = coordinateKey(lat, lng);
  const cached = readCache()[key];
  if (cached) return cached;

  const execute = async () => {
    const wait = Math.max(
      0,
      MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt),
    );
    if (wait > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, wait));
    }
    if (signal?.aborted) throw new DOMException('Dibatalkan', 'AbortError');

    const endpoint =
      import.meta.env.VITE_NOMINATIM_URL?.replace(/\/$/, '') ??
      DEFAULT_ENDPOINT;
    const parameters = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'jsonv2',
      addressdetails: '1',
      zoom: '18',
      'accept-language': 'id',
    });
    lastRequestAt = Date.now();
    const response = await fetch(`${endpoint}/reverse?${parameters}`, {
      headers: {
        Accept: 'application/json',
      },
      signal,
    });
    if (!response.ok) {
      throw new Error('Alamat lokasi tidak dapat ditemukan.');
    }
    const result = parseResult(
      (await response.json()) as NominatimReverseResponse,
    );
    if (!result.address) {
      throw new Error('Alamat lokasi belum tersedia pada peta.');
    }
    writeCache(key, result);
    return result;
  };

  const queued = requestQueue.then(execute, execute);
  requestQueue = queued.then(
    () => undefined,
    () => undefined,
  );
  return queued;
}

export const reverseGeocodingInternals = {
  formatAddress,
  parseResult,
};
