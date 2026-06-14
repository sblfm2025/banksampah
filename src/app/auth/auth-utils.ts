import type { AppUser } from '../../shared/schemas/user.schema';

export type AuthIdentifierType = 'email' | 'whatsapp' | 'invalid';

export function detectIdentifierType(value: string): AuthIdentifierType {
  const input = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) return 'email';
  if (/^(?:\+?62|0)8\d{7,12}$/.test(input.replace(/[\s-]/g, ''))) {
    return 'whatsapp';
  }
  return 'invalid';
}

export function normalizeIndonesianWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function getDefaultRouteByRole(role: AppUser['role']) {
  switch (role) {
    case 'CUSTOMER':
      return '/warga/dashboard';
    case 'DRIVER':
      return '/driver';
    case 'OPERATOR':
      return '/admin/tickets';
    case 'SUPER_ADMIN':
      return '/admin';
  }
}
