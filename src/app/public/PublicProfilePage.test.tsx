import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { PublicProfilePage } from './PublicProfilePage';
import { getPublicProfile } from './public-data';

describe('PublicProfilePage', () => {
  beforeEach(() => localStorage.clear());

  it('menyimpan profil lokal untuk permintaan berikutnya', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Nama lengkap'), 'Andi Saputra');
    await user.type(
      screen.getByLabelText('Nomor WhatsApp aktif'),
      '081234567890',
    );
    await user.selectOptions(
      screen.getByLabelText('Kecamatan'),
      'PALETEANG',
    );
    await user.type(
      screen.getByLabelText('Alamat utama'),
      'Jalan Poros Pinrang dekat masjid',
    );
    await user.click(screen.getByRole('button', { name: 'Simpan Profil' }));

    expect(
      await screen.findByText('Profil lokal berhasil disimpan.'),
    ).toBeInTheDocument();
    expect(getPublicProfile()).toMatchObject({
      fullName: 'Andi Saputra',
      phoneNumber: '6281234567890',
      district: 'PALETEANG',
      address: 'Jalan Poros Pinrang dekat masjid',
    });
  });

  it('membuka panduan layanan sebagai dialog', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Bantuan/ }));

    expect(
      screen.getByRole('dialog', { name: 'Panduan layanan' }),
    ).toBeInTheDocument();
  });
});
