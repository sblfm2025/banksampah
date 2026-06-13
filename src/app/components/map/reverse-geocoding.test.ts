import { describe, expect, it } from 'vitest';
import { reverseGeocodingInternals } from './reverse-geocoding';

describe('reverse geocoding parser', () => {
  it('membaca kecamatan dan kelurahan resmi dari response Nominatim', () => {
    const result = reverseGeocodingInternals.parseResult({
      display_name:
        'Jalan Jenderal Sudirman, Maccorawalie, Watang Sawitto, Pinrang',
      address: {
        road: 'Jalan Jenderal Sudirman',
        village: 'Maccorawalie',
        municipality: 'Watang Sawitto',
        city: 'Pinrang',
      },
    });
    expect(result.district).toBe('WATANG_SAWITTO');
    expect(result.villageId).toBe('maccorawalie');
    expect(result.address).toContain('Jalan Jenderal Sudirman');
    expect(result.addressParts.road).toBe('Jalan Jenderal Sudirman');
  });

  it('menormalisasi Sawito dari data peta eksternal', () => {
    const result = reverseGeocodingInternals.parseResult({
      display_name: 'Benteng Sawito, Paleteang, Pinrang',
      address: {
        suburb: 'Benteng Sawito',
        municipality: 'Paleteang',
      },
    });
    expect(result.district).toBe('PALETEANG');
    expect(result.villageId).toBe('benteng-sawitto');
  });

  it('menentukan kecamatan dari kelurahan ketika response OSM tidak lengkap', () => {
    const result = reverseGeocodingInternals.parseResult({
      display_name:
        'Jaya, Pinrang, Sulawesi Selatan, Sulawesi, 91211, Indonesia',
      address: {
        village: 'Jaya',
        town: 'Pinrang',
        postcode: '91211',
      },
    });
    expect(result.district).toBe('WATANG_SAWITTO');
    expect(result.villageId).toBe('jaya');
    expect(result.address).toBe('Jaya, Pinrang, 91211');
  });
});
