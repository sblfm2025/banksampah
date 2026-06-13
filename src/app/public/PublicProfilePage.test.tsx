import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthState } from '../auth/auth-context';
import { PublicProfilePage } from './PublicProfilePage';
import { getPublicProfile } from './public-data';

vi.mock('../components/map/LocationPicker', () => ({
  LocationPicker: ({
    onChange,
  }: {
    onChange: (point: { lat: number; lng: number }) => void;
  }) => (
    <button
      onClick={() => onChange({ lat: -3.78, lng: 119.65 })}
      type="button"
    >
      Pilih titik uji
    </button>
  ),
}));

vi.mock('../../shared/regions/service-area-boundaries', () => ({
  detectServiceArea: vi.fn().mockResolvedValue({
    district: 'PALETEANG',
    districtName: 'Paleteang',
    villageId: 'temmassarangnge',
    villageName: 'Temmassarangnge',
  }),
}));

vi.mock('../components/map/reverse-geocoding', () => ({
  reverseGeocode: vi.fn().mockResolvedValue({
    address: 'Jalan Bulu Manarang, Pinrang',
    addressParts: { road: 'Jalan Bulu Manarang' },
  }),
}));

const anonymousAuth: AuthState = {
  user: null,
  loading: false,
  authenticated: false,
  profileMissing: false,
  authUid: null,
  authEmail: null,
  authDisplayName: null,
  isGoogleUser: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  refreshProfile: async () => {},
  logout: async () => {},
};

function renderPage() {
  return render(
    <AuthContext.Provider value={anonymousAuth}>
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('PublicProfilePage', () => {
  beforeEach(() => localStorage.clear());

  it('menyimpan profil lokal untuk permintaan berikutnya', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Nama lengkap'), 'Andi Saputra');
    await user.type(
      screen.getByLabelText('Nomor WhatsApp aktif'),
      '081234567890',
    );
    await user.click(screen.getByRole('button', { name: 'Pilih titik uji' }));
    await screen.findByText(/Titik terdeteksi di Kelurahan/);
    await user.type(
      screen.getByLabelText('Alamat lengkap'),
      ' dekat masjid',
    );
    await user.click(screen.getByRole('button', { name: 'Simpan Profil' }));

    expect(
      await screen.findByText('Profil lokal berhasil disimpan.'),
    ).toBeInTheDocument();
    expect(getPublicProfile()).toMatchObject({
      fullName: 'Andi Saputra',
      phoneNumber: '6281234567890',
      district: 'PALETEANG',
      address:
        'Jalan Bulu Manarang, Kelurahan Temmassarangnge, Kecamatan Paleteang, Kabupaten Pinrang dekat masjid',
      location: { lat: -3.78, lng: 119.65 },
    });
  });

  it('membuka panduan layanan sebagai dialog', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Bantuan/ }));

    expect(
      screen.getByRole('dialog', { name: 'Panduan layanan' }),
    ).toBeInTheDocument();
  });
});
