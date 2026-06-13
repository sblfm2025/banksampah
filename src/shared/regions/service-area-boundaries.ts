import type { ActiveDistrict } from './region.types';

type Position = [number, number];
type LinearRing = Position[];
type PolygonCoordinates = LinearRing[];
type MultiPolygonCoordinates = PolygonCoordinates[];

export interface ServiceBoundaryFeature {
  type: 'Feature';
  bbox: [number, number, number, number];
  properties: {
    districtId: ActiveDistrict;
    villageId: string;
    districtName: string;
    villageName: string;
  };
  geometry: {
    type: 'MultiPolygon';
    coordinates: MultiPolygonCoordinates;
  };
}

export interface ServiceBoundaryCollection {
  type: 'FeatureCollection';
  name: string;
  source?: {
    dataset: string;
    custodian: string;
    edition: string;
    usageNote: string;
  };
  features: ServiceBoundaryFeature[];
}

export interface ServiceAreaMatch {
  district: ActiveDistrict;
  villageId: string;
  districtName: string;
  villageName: string;
}

let boundaryPromise: Promise<ServiceBoundaryCollection> | undefined;

export function loadServiceBoundaries(): Promise<ServiceBoundaryCollection> {
  boundaryPromise ??= fetch('/data/pinrang-service-boundaries.geojson').then(
    async (response) => {
      if (!response.ok) {
        throw new Error('Data batas wilayah tidak dapat dimuat.');
      }
      return (await response.json()) as ServiceBoundaryCollection;
    },
  );
  return boundaryPromise;
}

export async function detectServiceArea(
  lat: number,
  lng: number,
): Promise<ServiceAreaMatch | undefined> {
  return detectServiceAreaFromCollection(
    await loadServiceBoundaries(),
    lat,
    lng,
  );
}

export function detectServiceAreaFromCollection(
  collection: ServiceBoundaryCollection,
  lat: number,
  lng: number,
): ServiceAreaMatch | undefined {
  const feature = collection.features.find((candidate) => {
    const [west, south, east, north] = candidate.bbox;
    return (
      lng >= west &&
      lng <= east &&
      lat >= south &&
      lat <= north &&
      pointInMultiPolygon([lng, lat], candidate.geometry.coordinates)
    );
  });
  if (!feature) return undefined;
  return {
    district: feature.properties.districtId,
    villageId: feature.properties.villageId,
    districtName: feature.properties.districtName,
    villageName: feature.properties.villageName,
  };
}

function pointInMultiPolygon(
  point: Position,
  multiPolygon: MultiPolygonCoordinates,
): boolean {
  return multiPolygon.some((polygon) => pointInPolygon(point, polygon));
}

function pointInPolygon(
  point: Position,
  polygon: PolygonCoordinates,
): boolean {
  if (!polygon[0] || !pointInRing(point, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInRing(point, hole));
}

function pointInRing([lng, lat]: Position, ring: LinearRing): boolean {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [currentLng, currentLat] = ring[index];
    const [previousLng, previousLat] = ring[previous];
    if (
      pointOnSegment(
        [lng, lat],
        [previousLng, previousLat],
        [currentLng, currentLat],
      )
    ) {
      return true;
    }
    const crosses =
      currentLat > lat !== previousLat > lat &&
      lng <
        ((previousLng - currentLng) * (lat - currentLat)) /
          (previousLat - currentLat) +
          currentLng;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointOnSegment(
  [x, y]: Position,
  [x1, y1]: Position,
  [x2, y2]: Position,
): boolean {
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
  if (Math.abs(cross) > 1e-10) return false;
  return (
    x >= Math.min(x1, x2) - 1e-10 &&
    x <= Math.max(x1, x2) + 1e-10 &&
    y >= Math.min(y1, y2) - 1e-10 &&
    y <= Math.max(y1, y2) + 1e-10
  );
}
