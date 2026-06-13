import { describe, expect, it } from 'vitest';
import { createSafeFallbackAnalysis } from './waste-analysis.service';

describe('createSafeFallbackAnalysis', () => {
  it('mendeteksi kecamatan pilot secara konservatif dari teks', () => {
    const result = createSafeFallbackAnalysis({
      text: 'Saya di Paleteang mau jemput sampah',
      hasImage: true,
      hasLocation: false,
    });

    expect(result.detectedDistrict).toBe('PALETEANG');
    expect(result.recommendedServiceType).toBe('NEEDS_OPERATOR_REVIEW');
    expect(result.missingFields).toContain('ADDRESS');
    expect(result.missingFields).not.toContain('PHOTO');
  });

  it('menolak wilayah yang dikenali di luar pilot', () => {
    const result = createSafeFallbackAnalysis({
      text: 'Saya di Suppa',
    });

    expect(result.detectedDistrict).toBe('OUT_OF_AREA');
    expect(result.recommendedServiceType).toBe('REJECT');
  });
});
