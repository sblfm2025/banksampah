import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { savePublicTicket } from './public-data';
import { PublicStatusCheckPage } from './PublicStatusCheckPage';

describe('PublicStatusCheckPage', () => {
  beforeEach(() => localStorage.clear());

  it('mencocokkan kode draft dan nomor WhatsApp pada perangkat', async () => {
    const ticket = savePublicTicket({
      customerName: 'Andi',
      customerPhoneNumber: '081234567890',
      address: 'Jalan Melati, Watang Sawitto',
      district: 'WATANG_SAWITTO',
      villageId: 'sawitto',
      locationSource: 'MANUAL_TEXT',
      locationValidationStatus: 'NEEDS_OPERATOR_REVIEW',
      volume: 'MEDIUM',
      service: 'REGULAR_HOUSEHOLD_PICKUP',
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PublicStatusCheckPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText('Kode permintaan atau draft'),
      ticket.code,
    );
    await user.type(screen.getByLabelText('Nomor WhatsApp'), '0812 3456 7890');
    await user.click(screen.getByRole('button', { name: 'Cek Status' }));

    expect(screen.getByText('Draft di perangkat')).toBeInTheDocument();
    expect(screen.getByText('Jalan Melati, Watang Sawitto')).toBeInTheDocument();
  });
});
