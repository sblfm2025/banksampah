import { beforeEach, describe, expect, it } from 'vitest';
import {
  getPublicTicket,
  getPublicProfile,
  isValidIndonesianPhoneNumber,
  listPublicTickets,
  normalizeIndonesianPhoneNumber,
  savePublicProfile,
  savePublicTicket,
} from './public-data';

describe('public ticket draft', () => {
  beforeEach(() => localStorage.clear());

  it('menyimpan draft permintaan warga tanpa data kilogram atau harga', () => {
    const ticket = savePublicTicket({
      customerName: 'Andi',
      customerPhoneNumber: '0812-3456-7890',
      address: 'Jalan Poros Pinrang dekat masjid',
      district: 'PALETEANG',
      villageId: 'mamminasae',
      locationSource: 'MANUAL_TEXT',
      locationValidationStatus: 'NEEDS_OPERATOR_REVIEW',
      volume: 'MEDIUM',
      service: 'REGULAR_HOUSEHOLD_PICKUP',
      wasteDescription: 'Plastik dan kardus rumah tangga',
      wasteTypes: ['plastik', 'kertas'],
      preferredTime: '2026-06-15T09:00',
      notes: 'Rumah pagar hijau',
    });

    expect(ticket.status).toBe('NEW');
    expect(ticket.code).toMatch(/^DRAFT-\d{8}-001$/);
    expect(listPublicTickets()).toHaveLength(1);
    expect(getPublicTicket(ticket.id)?.address).toContain('Pinrang');
    expect(ticket.customerName).toBe('Andi');
    expect(ticket.customerPhoneNumber).toBe('6281234567890');
    expect(ticket.wasteTypes).toEqual(['plastik', 'kertas']);
    expect(getPublicProfile()).toMatchObject({
      fullName: 'Andi',
      phoneNumber: '6281234567890',
      address: 'Jalan Poros Pinrang dekat masjid',
      district: 'PALETEANG',
      villageId: 'mamminasae',
    });
    expect(ticket).not.toHaveProperty('weightKg');
    expect(ticket).not.toHaveProperty('price');
  });

  it('menormalisasi dan memvalidasi nomor WhatsApp Indonesia', () => {
    expect(normalizeIndonesianPhoneNumber('0812 3456 7890')).toBe(
      '6281234567890',
    );
    expect(isValidIndonesianPhoneNumber('+62 812-3456-7890')).toBe(true);
    expect(isValidIndonesianPhoneNumber('123')).toBe(false);
  });

  it('menyimpan profil lokal yang dapat dipakai ulang', () => {
    savePublicProfile({
      fullName: 'Sitti Aminah',
      phoneNumber: '0852 1111 2222',
      address: 'Jalan Melati, Pinrang',
      district: 'WATANG_SAWITTO',
      villageId: 'sawitto',
    });

    expect(getPublicProfile()).toMatchObject({
      fullName: 'Sitti Aminah',
      phoneNumber: '6285211112222',
      address: 'Jalan Melati, Pinrang',
      district: 'WATANG_SAWITTO',
      villageId: 'sawitto',
    });
  });
});
