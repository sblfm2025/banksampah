import { describe, expect, it } from 'vitest';
import {
  detectIdentifierType,
  getDefaultRouteByRole,
  normalizeIndonesianWhatsApp,
} from './auth-utils';

describe('auth utils', () => {
  it('mendeteksi email dan nomor WhatsApp Indonesia', () => {
    expect(detectIdentifierType('warga@example.com')).toBe('email');
    expect(detectIdentifierType('0812 3456 7890')).toBe('whatsapp');
    expect(detectIdentifierType('+62-812-3456-7890')).toBe('whatsapp');
    expect(detectIdentifierType('nomor salah')).toBe('invalid');
  });

  it('menormalisasi nomor lokal ke format 62', () => {
    expect(normalizeIndonesianWhatsApp('0812-3456-7890')).toBe(
      '6281234567890',
    );
  });

  it('menentukan dashboard berdasarkan role', () => {
    expect(getDefaultRouteByRole('CUSTOMER')).toBe('/warga/dashboard');
    expect(getDefaultRouteByRole('DRIVER')).toBe('/driver');
    expect(getDefaultRouteByRole('OPERATOR')).toBe('/admin/tickets');
    expect(getDefaultRouteByRole('SUPER_ADMIN')).toBe('/admin');
  });
});
