import { describe, expect, it } from 'vitest';
import {
  detectDistrict,
  detectVillage,
  normalizeRegionText,
} from './region-normalizer';

describe('region normalizer', () => {
  it('menormalisasi spasi dan tanda baca', () => {
    expect(normalizeRegionText('  Benteng,   Sawitto! ')).toBe(
      'benteng sawitto',
    );
  });

  it('mengenali typo Sawito tetapi mengembalikan id resmi', () => {
    expect(detectDistrict('Saya di Watang Sawito')).toBe('WATANG_SAWITTO');
    expect(detectVillage('Dekat Benteng Sawito')).toBe('benteng-sawitto');
  });

  it('mengenali kecamatan dari nama kelurahan', () => {
    expect(detectDistrict('Rumah di Mamminasae')).toBe('PALETEANG');
    expect(detectVillage('Kelurahan Maccorawalie')).toBe('maccorawalie');
  });

  it('menandai kecamatan yang dikenal di luar area pilot', () => {
    expect(detectDistrict('Alamat saya di Suppa')).toBe('OUT_OF_AREA');
  });
});
