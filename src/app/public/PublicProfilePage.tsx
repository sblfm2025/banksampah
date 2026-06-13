import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DISTRICT_LABELS } from '../../shared/constants/districts';
import type {
  ActiveDistrict,
  LocationSource,
  LocationValidationStatus,
} from '../../shared/regions/region.types';
import {
  getVillage,
  villagesForDistrict,
} from '../../shared/regions/service-areas';
import { detectServiceArea } from '../../shared/regions/service-area-boundaries';
import { composeServiceAddress } from '../../shared/regions/location-address';
import { useAuth } from '../auth/auth-context';
import { LocationPicker } from '../components/map/LocationPicker';
import { reverseGeocode } from '../components/map/reverse-geocoding';
import {
  AppDialog,
  AppHeader,
  AppIcon,
  Card,
  PrimaryButton,
} from '../ui/components';
import {
  getPublicProfile,
  isValidIndonesianPhoneNumber,
  normalizeIndonesianPhoneNumber,
  savePublicProfile,
} from './public-data';

const information = {
  help: {
    title: 'Panduan layanan',
    description:
      'Gunakan GPS atau geser pin ke posisi rumah, lalu periksa alamat dan patokan sebelum menyimpan profil.',
  },
  terms: {
    title: 'Ketentuan layanan pilot',
    description:
      'Layanan awal hanya untuk Watang Sawitto dan Paleteang. Data profil dipakai untuk verifikasi dan pelaksanaan penjemputan.',
  },
  about: {
    title: 'Tentang aplikasi',
    description:
      'Jemput Sampah Pinrang membantu warga mengajukan penjemputan dan operator mengelola layanan secara lebih tertib.',
  },
} as const;

type InformationKey = keyof typeof information;

export function PublicProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const onboarding =
    searchParams.get('onboarding') === '1' ||
    (auth.isGoogleUser && auth.profileMissing);
  const localProfile = getPublicProfile();
  const customer = auth.user?.role === 'CUSTOMER' ? auth.user : null;
  const [fullName, setFullName] = useState(
    customer?.name ?? auth.authDisplayName ?? localProfile?.fullName ?? '',
  );
  const [phoneNumber, setPhoneNumber] = useState(
    customer?.phoneNumber ?? localProfile?.phoneNumber ?? '',
  );
  const [address, setAddress] = useState(
    customer?.addressText ?? localProfile?.address ?? '',
  );
  const [district, setDistrict] = useState<ActiveDistrict | ''>(
    customer?.district ?? localProfile?.district ?? '',
  );
  const [villageId, setVillageId] = useState(
    customer?.villageId ?? localProfile?.villageId ?? '',
  );
  const [location, setLocation] = useState<
    { lat: number; lng: number } | undefined
  >(customer?.location ?? localProfile?.location);
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<
    number | undefined
  >(customer?.locationAccuracyMeters ?? localProfile?.locationAccuracyMeters);
  const [locationSource, setLocationSource] = useState<
    Extract<LocationSource, 'BROWSER_GPS' | 'MANUAL_PIN'>
  >(
    customer?.locationSource === 'BROWSER_GPS'
      ? 'BROWSER_GPS'
      : localProfile?.locationSource === 'BROWSER_GPS'
        ? 'BROWSER_GPS'
        : 'MANUAL_PIN',
  );
  const [locationValidationStatus, setLocationValidationStatus] =
    useState<LocationValidationStatus>(
      customer?.locationValidationStatus ??
        localProfile?.locationValidationStatus ??
        'UNKNOWN',
    );
  const [locationMessage, setLocationMessage] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [openInformation, setOpenInformation] = useState<InformationKey>();
  const geocodingTimer = useRef<number | undefined>(undefined);
  const geocodingAbort = useRef<AbortController | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(geocodingTimer.current);
      geocodingAbort.current?.abort();
    },
    [],
  );

  const valid =
    fullName.trim().length >= 2 &&
    isValidIndonesianPhoneNumber(phoneNumber) &&
    address.trim().length >= 8 &&
    Boolean(district && villageId && location) &&
    locationValidationStatus === 'INSIDE_SERVICE_AREA';

  function updateLocation(
    point: { lat: number; lng: number },
    source: Extract<LocationSource, 'BROWSER_GPS' | 'MANUAL_PIN'>,
    accuracy?: number,
  ) {
    setLocation(point);
    setLocationSource(source);
    setLocationAccuracyMeters(accuracy);
    setLocationValidationStatus('UNKNOWN');
    setLocationMessage('Menyesuaikan alamat dan wilayah dari titik peta...');
    window.clearTimeout(geocodingTimer.current);
    geocodingAbort.current?.abort();
    geocodingTimer.current = window.setTimeout(() => {
      const controller = new AbortController();
      geocodingAbort.current = controller;
      setIsResolvingAddress(true);
      void Promise.allSettled([
        detectServiceArea(point.lat, point.lng),
        reverseGeocode(point.lat, point.lng, controller.signal),
      ])
        .then(([boundaryResult, addressResult]) => {
          const area =
            boundaryResult.status === 'fulfilled'
              ? boundaryResult.value
              : undefined;
          if (area) {
            setDistrict(area.district);
            setVillageId(area.villageId);
            setLocationValidationStatus('INSIDE_SERVICE_AREA');
          } else if (boundaryResult.status === 'fulfilled') {
            setDistrict('');
            setVillageId('');
            setLocationValidationStatus('OUTSIDE_SERVICE_AREA');
          }
          if (addressResult.status === 'fulfilled') {
            setAddress(
              area
                ? composeServiceAddress(addressResult.value.addressParts, area)
                : addressResult.value.address,
            );
          }
          setLocationMessage(
            area
              ? `Titik terdeteksi di Kelurahan ${area.villageName}, Kecamatan ${area.districtName}. Periksa kembali detail alamatnya.`
              : 'Titik berada di luar wilayah layanan Watang Sawitto dan Paleteang.',
          );
        })
        .finally(() => setIsResolvingAddress(false));
    }, 500);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Perangkat ini tidak menyediakan akses GPS.');
      return;
    }
    setLocationMessage('Mendeteksi lokasi saat ini...');
    navigator.geolocation.getCurrentPosition(
      (position) =>
        updateLocation(
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          'BROWSER_GPS',
          position.coords.accuracy,
        ),
      () =>
        setLocationMessage(
          'GPS tidak dapat digunakan. Izinkan akses lokasi atau pilih titik pada peta.',
        ),
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || !district || !location) return;
    setSaving(true);
    setMessage('');
    const normalizedPhone = normalizeIndonesianPhoneNumber(phoneNumber);
    const profile = {
      fullName,
      phoneNumber: normalizedPhone,
      address,
      district,
      villageId,
      location,
      locationAccuracyMeters,
      locationSource,
      locationValidationStatus,
    };
    try {
      savePublicProfile(profile);
      if (auth.authenticated && auth.isGoogleUser) {
        const { saveCustomerAppProfile } = await import('../../client/firebase');
        await saveCustomerAppProfile(profile);
        await auth.refreshProfile();
        navigate('/', { replace: true });
        return;
      }
      setPhoneNumber(normalizedPhone);
      setMessage('Profil lokal berhasil disimpan.');
    } catch {
      setMessage(
        'Profil belum dapat disimpan ke akun. Periksa koneksi lalu coba lagi.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppHeader
        subtitle={
          onboarding ? 'Lengkapi data sebelum membuat permintaan' : 'Identitas dan lokasi utama'
        }
        title={onboarding ? 'Lengkapi Profil' : 'Profil'}
      />
      <main className="app-container space-y-5 py-7">
        {onboarding && (
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
            Login Google berhasil. Lengkapi nama, WhatsApp, alamat, dan titik
            rumah agar permintaan dapat diproses dengan tepat.
          </div>
        )}
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e6f7fa] text-[#087f8c]">
            <AppIcon name="user" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-extrabold">
              {fullName.trim() || 'Warga Pinrang'}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-500">
              {auth.isGoogleUser
                ? auth.authEmail
                : 'Profil tersimpan hanya di perangkat ini'}
            </p>
          </div>
        </Card>

        <form onSubmit={submit}>
          <Card className="p-5 sm:p-6">
            <h2 className="font-extrabold">Data utama</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Data ini akan mengisi otomatis permintaan berikutnya.
            </p>
            {message && (
              <p className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm font-medium text-cyan-900">
                {message}
              </p>
            )}
            <ProfileField
              autoComplete="name"
              label="Nama lengkap"
              onChange={setFullName}
              placeholder="Nama sesuai identitas"
              value={fullName}
            />
            <ProfileField
              autoComplete="tel"
              inputMode="tel"
              label="Nomor WhatsApp aktif"
              onChange={setPhoneNumber}
              placeholder="Contoh: 0812 3456 7890"
              type="tel"
              value={phoneNumber}
            />
            {phoneNumber && !isValidIndonesianPhoneNumber(phoneNumber) && (
              <p className="mt-2 text-xs font-medium text-red-600">
                Masukkan nomor seluler Indonesia yang valid.
              </p>
            )}
            <label className="mt-4 block text-sm font-bold">
              Kecamatan
              <select
                className="mt-2 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 font-normal outline-none focus:border-[#159fb3]"
                onChange={(event) => {
                  const value = event.target.value as ActiveDistrict | '';
                  setDistrict(value);
                  setVillageId(value ? villagesForDistrict(value)[0].id : '');
                  setLocationValidationStatus('UNKNOWN');
                }}
                value={district}
              >
                <option value="">Pilih kecamatan</option>
                <option value="WATANG_SAWITTO">
                  {DISTRICT_LABELS.WATANG_SAWITTO}
                </option>
                <option value="PALETEANG">
                  {DISTRICT_LABELS.PALETEANG}
                </option>
              </select>
            </label>
            <label className="mt-4 block text-sm font-bold">
              Kelurahan
              <select
                className="mt-2 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 font-normal outline-none focus:border-[#159fb3]"
                disabled={!district}
                onChange={(event) => {
                  setVillageId(event.target.value);
                  setLocationValidationStatus('UNKNOWN');
                }}
                value={villageId}
              >
                <option value="">Pilih kelurahan</option>
                {district &&
                  villagesForDistrict(district).map((village) => (
                    <option key={village.id} value={village.id}>
                      {village.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-bold">
              Alamat lengkap
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 font-normal outline-none focus:border-[#159fb3]"
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Nama jalan, nomor rumah, lingkungan, dan patokan"
                value={address}
              />
            </label>

            <button
              className="mt-4 flex items-center gap-2 font-semibold text-[#087f8c]"
              onClick={useCurrentLocation}
              type="button"
            >
              <AppIcon name="pin" />
              Gunakan lokasi saat ini
            </button>
            {locationMessage && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {locationMessage}
              </p>
            )}
            <div className="mt-5">
              <p className="text-sm font-bold">Titik rumah</p>
              <p className="mb-3 mt-1 text-xs text-slate-500">
                Ketuk peta atau geser pin tepat ke lokasi penjemputan.
              </p>
              {isResolvingAddress && (
                <p className="mb-3 rounded-xl bg-[#e6f7fa] px-3 py-2 text-xs font-semibold text-[#087f8c]">
                  Menyesuaikan alamat dari titik peta...
                </p>
              )}
              <LocationPicker
                onChange={(point) => updateLocation(point, 'MANUAL_PIN')}
                value={location}
              />
            </div>
            {district && villageId && (
              <p className="mt-3 text-xs text-slate-500">
                Wilayah: {getVillage(villageId)?.name},{' '}
                {DISTRICT_LABELS[district]}
              </p>
            )}
            {location && locationValidationStatus !== 'INSIDE_SERVICE_AREA' && (
              <p className="mt-3 text-xs font-medium text-amber-700">
                Titik peta harus terverifikasi berada di dalam wilayah layanan.
              </p>
            )}
            <PrimaryButton
              className="mt-5 w-full"
              disabled={!valid || saving || isResolvingAddress}
              type="submit"
            >
              {saving
                ? 'Menyimpan...'
                : onboarding
                  ? 'Simpan dan Lanjutkan'
                  : 'Simpan Profil'}
            </PrimaryButton>
          </Card>
        </form>

        <Card className="divide-y divide-slate-100 px-5">
          <InformationButton label="Bantuan" onClick={() => setOpenInformation('help')} value="Panduan menggunakan layanan" />
          <InformationButton label="Syarat dan Ketentuan" onClick={() => setOpenInformation('terms')} value="Ketentuan layanan pilot" />
          <InformationButton label="Tentang Aplikasi" onClick={() => setOpenInformation('about')} value="Jemput Sampah Pinrang" />
        </Card>

        {auth.isGoogleUser ? (
          <button
            className="block w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-center font-bold text-slate-700"
            onClick={() => void auth.logout()}
            type="button"
          >
            Keluar dari akun
          </button>
        ) : (
          <Link
            className="block rounded-2xl border border-[#159fb3] bg-white px-5 py-4 text-center font-bold text-[#087f8c]"
            to="/login"
          >
            Masuk atau daftar dengan Google
          </Link>
        )}
      </main>

      <AppDialog
        description={openInformation ? information[openInformation].description : ''}
        icon="spark"
        onConfirm={() => setOpenInformation(undefined)}
        open={Boolean(openInformation)}
        title={openInformation ? information[openInformation].title : ''}
      />
    </>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <label className="mt-4 block text-sm font-bold">
      {label}
      <input
        {...props}
        className="mt-2 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 font-normal outline-none focus:border-[#159fb3]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function InformationButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center justify-between gap-4 py-4 text-left"
      onClick={onClick}
      type="button"
    >
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-1 block text-xs text-slate-500">{value}</span>
      </span>
      <span aria-hidden className="text-lg text-slate-300">
        &rsaquo;
      </span>
    </button>
  );
}
