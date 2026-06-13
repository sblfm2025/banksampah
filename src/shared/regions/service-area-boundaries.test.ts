import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  detectServiceAreaFromCollection,
  type ServiceBoundaryCollection,
} from './service-area-boundaries';

const boundaries = JSON.parse(
  readFileSync('public/data/pinrang-service-boundaries.geojson', 'utf8'),
) as ServiceBoundaryCollection;

describe('service area boundaries', () => {
  it('memuat seluruh 14 kelurahan layanan', () => {
    expect(boundaries.features).toHaveLength(14);
    expect(
      new Set(boundaries.features.map((item) => item.properties.villageId)).size,
    ).toBe(14);
  });

  it('mendeteksi titik Kelurahan Temmassarangnge sebagai Paleteang', () => {
    const result = detectServiceAreaFromCollection(
      boundaries,
      -3.7674335,
      119.6513112,
    );
    expect(result?.district).toBe('PALETEANG');
    expect(result?.villageId).toBe('temmassarangnge');
  });

  it('mendeteksi titik interior Kelurahan Jaya sebagai Watang Sawitto', () => {
    const result = detectServiceAreaFromCollection(
      boundaries,
      -3.8004663592968657,
      119.64881306649882,
    );
    expect(result?.district).toBe('WATANG_SAWITTO');
    expect(result?.villageId).toBe('jaya');
  });

  it('mengembalikan kosong untuk titik di luar dua kecamatan', () => {
    expect(
      detectServiceAreaFromCollection(boundaries, -3.95, 119.55),
    ).toBeUndefined();
  });
});
