import { describe, expect, it } from 'vitest';
import { composeServiceAddress } from './location-address';

const temmassarangnge = {
  district: 'PALETEANG' as const,
  villageId: 'temmassarangnge',
  districtName: 'Paleteang',
  villageName: 'Temmassarangnge',
};

describe('service address composer', () => {
  it('mengganti wilayah OSM yang keliru dengan hasil polygon', () => {
    expect(
      composeServiceAddress(
        {
          road: 'Jalan Bulu Mandrang',
          neighbourhood: 'Penrang',
          postcode: '91213',
        },
        temmassarangnge,
      ),
    ).toBe(
      'Jalan Bulu Mandrang, Kelurahan Temmassarangnge, Kecamatan Paleteang, Kabupaten Pinrang, 91213',
    );
  });

  it('mempertahankan nama lingkungan yang bukan kelurahan', () => {
    expect(
      composeServiceAddress(
        {
          road: 'Jalan Bulu Mandrang',
          neighbourhood: 'Kampung Baru',
          postcode: '91213',
        },
        temmassarangnge,
      ),
    ).toContain('Kampung Baru, Kelurahan Temmassarangnge');
  });
});
