import { beforeEach, describe, expect, it } from 'vitest';
import {
  getPublicTicket,
  listPublicTickets,
  savePublicTicket,
} from './public-data';

describe('public ticket draft', () => {
  beforeEach(() => localStorage.clear());

  it('menyimpan draft tiket warga tanpa data kilogram atau harga', () => {
    const ticket = savePublicTicket({
      address: 'Jalan Poros Pinrang dekat masjid',
      district: 'PALETEANG',
      villageId: 'mamminasae',
      locationSource: 'MANUAL_TEXT',
      locationValidationStatus: 'NEEDS_OPERATOR_REVIEW',
      volume: 'MEDIUM',
      service: 'REGULAR_HOUSEHOLD_PICKUP',
      notes: 'Rumah pagar hijau',
    });

    expect(ticket.status).toBe('NEW');
    expect(ticket.code).toMatch(/^DRAFT-\d{8}-001$/);
    expect(listPublicTickets()).toHaveLength(1);
    expect(getPublicTicket(ticket.id)?.address).toContain('Pinrang');
    expect(ticket).not.toHaveProperty('weightKg');
    expect(ticket).not.toHaveProperty('price');
  });
});
