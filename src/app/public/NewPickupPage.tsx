import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppHeader,
  AppDialog,
  AppIcon,
  BottomSheet,
  Card,
  ConfirmModal,
  OutlineButton,
  PhotoUploadCard,
  PrimaryButton,
} from '../ui/components';
import { LocationPicker } from '../components/map/LocationPicker';
import {
  getVillage,
  villagesForDistrict,
} from '../../shared/regions/service-areas';
import type {
  ActiveDistrict,
  LocationSource,
  LocationValidationStatus,
} from '../../shared/regions/region.types';
import {
  getPublicProfile,
  isValidIndonesianPhoneNumber,
  normalizeIndonesianPhoneNumber,
  savePublicTicket,
} from './public-data';
import { reverseGeocode } from '../components/map/reverse-geocoding';
import { detectServiceArea } from '../../shared/regions/service-area-boundaries';
import { composeServiceAddress } from '../../shared/regions/location-address';

type Volume = 'SMALL' | 'MEDIUM' | 'LARGE' | 'OVERSIZED';

const volumeOptions: Array<{
  value: Volume;
  label: string;
  description: string;
}> = [
  { value: 'SMALL', label: 'Sampah kecil', description: 'Beberapa kantong rumah tangga' },
  { value: 'MEDIUM', label: 'Sampah sedang', description: 'Cukup banyak, masih mudah diangkut' },
  { value: 'LARGE', label: 'Sampah banyak', description: 'Membutuhkan motor sampah 3 roda' },
  { value: 'OVERSIZED', label: 'Perlu dicek operator', description: 'Volume sangat banyak atau tidak biasa' },
];

export function NewPickupPage() {
  const navigate = useNavigate();
  const savedProfile = getPublicProfile();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(savedProfile?.address ?? '');
  const [district, setDistrict] = useState<ActiveDistrict | ''>(
    savedProfile?.district ?? '',
  );
  const [villageId, setVillageId] = useState(savedProfile?.villageId ?? '');
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(
    savedProfile?.location,
  );
  const [locationAccuracyMeters, setLocationAccuracyMeters] =
    useState<number | undefined>(savedProfile?.locationAccuracyMeters);
  const [locationSource, setLocationSource] =
    useState<LocationSource>(savedProfile?.locationSource ?? 'MANUAL_TEXT');
  const [locationValidationStatus, setLocationValidationStatus] =
    useState<LocationValidationStatus>(
      savedProfile?.locationValidationStatus ?? 'UNKNOWN',
    );
  const [locationMessage, setLocationMessage] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
    tone?: 'primary' | 'danger' | 'warning' | 'success';
  }>();
  const geocodingTimer = useRef<number | undefined>(undefined);
  const geocodingAbort = useRef<AbortController | undefined>(undefined);
  const [photo, setPhoto] = useState<string>();
  const [volume, setVolume] = useState<Volume>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState(
    savedProfile?.fullName ?? '',
  );
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState(
    savedProfile?.phoneNumber ?? '',
  );
  const [sheet, setSheet] = useState<'district' | 'volume' | null>(null);
  const [confirm, setConfirm] = useState(false);

  const recommendation =
    volume === 'LARGE' || volume === 'OVERSIZED'
      ? 'Angkut 1 kali jalan'
      : 'Jemput reguler';
  const canContinue =
    step === 1
      ? address.trim().length >= 8 &&
        Boolean(district) &&
        Boolean(villageId)
      : step === 2
        ? Boolean(photo)
        : step === 4
          ? customerName.trim().length >= 2 &&
            isValidIndonesianPhoneNumber(customerPhoneNumber)
          : true;

  function selectPhoto(file?: File) {
    if (!file) return;
    if (file.size > 10_485_760) {
      setNotice({
        title: 'Foto terlalu besar',
        description: 'Ukuran foto maksimal 10 MB. Pilih foto lain yang lebih kecil.',
        tone: 'warning',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  function updateLocation(
    point: { lat: number; lng: number },
    source: LocationSource,
    accuracy?: number,
  ) {
    setLocation(point);
    setAddress('');
    setLocationAccuracyMeters(accuracy);
    setLocationSource(source);
    setLocationMessage(
      source === 'BROWSER_GPS'
        ? `Lokasi terdeteksi${accuracy ? ` dengan akurasi sekitar ${Math.round(accuracy)} meter` : ''}. Mencari alamat...`
        : 'Titik dipilih. Menyesuaikan alamat...',
    );
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
          } else {
            setLocationValidationStatus('UNKNOWN');
          }

          if (addressResult.status === 'fulfilled') {
            setAddress(
              area
                ? composeServiceAddress(
                    addressResult.value.addressParts,
                    area,
                  )
                : addressResult.value.address,
            );
          }

          if (area && addressResult.status === 'fulfilled') {
            setLocationMessage(
              `Lokasi terdeteksi di Kelurahan ${area.villageName}, Kecamatan ${area.districtName}. Alamat juga berhasil disesuaikan.`,
            );
          } else if (area) {
            setLocationMessage(
              `Lokasi terdeteksi di Kelurahan ${area.villageName}, Kecamatan ${area.districtName}. Lengkapi alamat secara manual.`,
            );
          } else if (boundaryResult.status === 'fulfilled') {
            setLocationMessage(
              'Titik berada di luar wilayah layanan Watang Sawitto dan Paleteang. Geser pin atau pilih wilayah secara manual untuk diperiksa operator.',
            );
          } else {
            setLocationMessage(
              'Data batas wilayah belum dapat dimuat. Pilih kecamatan dan kelurahan secara manual.',
            );
          }
        })
        .finally(() => {
          if (geocodingAbort.current === controller) {
            setIsResolvingAddress(false);
          }
        });
    }, 700);
  }

  function finish() {
    if (!district || !villageId) return;
    const ticket = savePublicTicket({
      customerName,
      customerPhoneNumber,
      address,
      district,
      villageId,
      location,
      locationAccuracyMeters,
      locationSource,
      locationValidationStatus,
      volume,
      service:
        recommendation === 'Jemput reguler'
          ? 'REGULAR_HOUSEHOLD_PICKUP'
          : 'ONE_TRIP_TRICYCLE',
      notes,
      photo,
    });
    navigate(`/tickets/${ticket.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        back={
          <Link className="text-xl text-[#087f8c]" to="/">
            &larr;
          </Link>
        }
        subtitle={`Langkah ${step} dari 4`}
        title="Ajukan Jemput"
      />
      <main className="app-container max-w-2xl py-7">
        <div className="mb-7 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((item) => (
            <span
              className={`h-2 rounded-full ${item <= step ? 'bg-[#159fb3]' : 'bg-slate-200'}`}
              key={item}
            />
          ))}
        </div>

        {step === 1 && (
          <StepCard
            description="Pastikan lokasi berada di Watang Sawitto atau Paleteang."
            icon="pin"
            title="Lokasi Jemput"
          >
            <button
              className="flex w-full items-center justify-between rounded-2xl border border-[#d9e2e7] bg-white p-4 text-left"
              onClick={() => setSheet('district')}
              type="button"
            >
              <span>
                <span className="block text-xs font-semibold text-slate-400">
                  Kecamatan
                </span>
                <span className="mt-1 block font-bold">
                  {district === 'WATANG_SAWITTO'
                    ? 'Watang Sawitto'
                    : district === 'PALETEANG'
                      ? 'Paleteang'
                      : 'Belum dipilih'}
                </span>
              </span>
              <span aria-hidden>⌄</span>
            </button>
            <label className="mt-4 block text-sm font-bold">
              Kelurahan
              <select
                className="mt-2 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 outline-none focus:border-[#159fb3]"
                onChange={(event) => setVillageId(event.target.value)}
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
                className="mt-2 min-h-32 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 font-normal outline-none focus:border-[#159fb3]"
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Contoh: Jl. Poros Pinrang, dekat masjid..."
                value={address}
              />
            </label>
            <button
              className="mt-3 flex items-center gap-2 text-sm font-bold text-[#087f8c]"
              onClick={() => {
                if (!navigator.geolocation) {
                  setLocationMessage(
                    'GPS tidak tersedia. Isi alamat dan pilih titik pada peta.',
                  );
                  return;
                }
                setLocationMessage('Mendeteksi lokasi perangkat...');
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    updateLocation(
                      {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                      },
                      'BROWSER_GPS',
                      position.coords.accuracy,
                    );
                  },
                  () =>
                    setLocationMessage(
                      'Izin GPS tidak tersedia. Isi alamat dan pilih titik pada peta.',
                    ),
                  { enableHighAccuracy: true, timeout: 12_000 },
                );
              }}
              type="button"
            >
              <AppIcon name="pin" />
              Pilih lokasi saat ini
            </button>
            {locationMessage && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {locationMessage}
              </p>
            )}
            <div className="mt-5">
              <p className="text-sm font-bold">Titik lokasi</p>
              <p className="mb-3 mt-1 text-xs text-slate-500">
                Ketuk peta atau geser pin jika titik belum tepat.
              </p>
              {isResolvingAddress && (
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#e6f7fa] px-3 py-2 text-xs font-semibold text-[#087f8c]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#9bd4dc] border-t-[#087f8c]" />
                  Menyesuaikan alamat dari titik peta...
                </div>
              )}
              <LocationPicker
                onChange={(point) => {
                  updateLocation(point, 'MANUAL_PIN');
                }}
                value={location}
              />
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-5 rounded-full bg-[#087f8c]" />
                  Watang Sawitto
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-5 rounded-full bg-violet-600" />
                  Paleteang
                </span>
              </div>
            </div>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard
            description="Foto membantu sistem dan operator memperkirakan volume."
            icon="camera"
            title="Foto Sampah"
          >
            <PhotoUploadCard
              label="Ambil atau pilih foto"
              onChange={selectPhoto}
              preview={photo}
            />
          </StepCard>
        )}

        {step === 3 && (
          <StepCard
            description="Pilih perkiraan terdekat. Operator tetap akan memeriksa foto."
            icon="spark"
            title="Cek Volume Otomatis"
          >
            <button
              className="flex w-full items-center justify-between rounded-2xl border border-[#d9e2e7] bg-white p-4 text-left"
              onClick={() => setSheet('volume')}
              type="button"
            >
              <span>
                <span className="block text-xs font-semibold text-slate-400">
                  Estimasi volume
                </span>
                <span className="mt-1 block font-bold">
                  {volumeOptions.find((item) => item.value === volume)?.label}
                </span>
              </span>
              <span aria-hidden>⌄</span>
            </button>
            <Card className="mt-4 border-0 bg-[#e6f7fa] p-5 shadow-none">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087f8c]">
                Rekomendasi
              </p>
              <h3 className="mt-2 text-lg font-extrabold">{recommendation}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {volume === 'OVERSIZED'
                  ? 'Operator perlu memeriksa kapasitas dan jenis sampah.'
                  : 'Rekomendasi awal berdasarkan foto dan pilihan volume.'}
              </p>
            </Card>
          </StepCard>
        )}

        {step === 4 && (
          <StepCard
            description="Lengkapi kontak yang dapat dihubungi, lalu periksa kembali pengajuan."
            icon="ticket"
            title="Identitas & Konfirmasi"
          >
            <label className="block text-sm font-bold">
              Nama lengkap
              <input
                autoComplete="name"
                className="mt-2 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 font-normal outline-none focus:border-[#159fb3]"
                maxLength={120}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Nama warga yang mengajukan"
                required
                value={customerName}
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Nomor WhatsApp aktif
              <input
                autoComplete="tel"
                className="mt-2 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 font-normal outline-none focus:border-[#159fb3]"
                inputMode="tel"
                onChange={(event) => setCustomerPhoneNumber(event.target.value)}
                placeholder="Contoh: 0812 3456 7890"
                required
                type="tel"
                value={customerPhoneNumber}
              />
              {customerPhoneNumber &&
                !isValidIndonesianPhoneNumber(customerPhoneNumber) && (
                  <span className="mt-2 block text-xs font-medium text-red-600">
                    Masukkan nomor seluler Indonesia yang valid.
                  </span>
                )}
            </label>
            <label className="mt-4 block text-sm font-bold">
              Catatan untuk petugas
            <textarea
              className="mt-2 min-h-32 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 font-normal outline-none focus:border-[#159fb3]"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Contoh: rumah pagar hijau, ada pecahan kaca..."
              value={notes}
            />
            </label>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Pengajuan web disimpan sebagai draft di perangkat ini. Operator
              belum menerima data sampai kanal pengiriman permintaan web
              diaktifkan.
            </div>
            <Card className="mt-4 p-5 shadow-none">
              <Summary label="Nama" value={customerName || '-'} />
              <Summary
                label="WhatsApp"
                value={
                  customerPhoneNumber
                    ? `+${normalizeIndonesianPhoneNumber(customerPhoneNumber)}`
                    : '-'
                }
              />
              <Summary
                label="Kecamatan"
                value={
                  district === 'WATANG_SAWITTO'
                    ? 'Watang Sawitto'
                    : district === 'PALETEANG'
                      ? 'Paleteang'
                      : 'Belum dipilih'
                }
              />
              <Summary
                label="Kelurahan"
                value={getVillage(villageId)?.name ?? '-'}
              />
              <Summary label="Alamat" value={address} />
              <Summary
                label="Titik GPS"
                value={
                  location
                    ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                    : 'Belum dipilih'
                }
              />
              <Summary label="Volume" value={volumeOptions.find((item) => item.value === volume)!.label} />
              <Summary label="Layanan" value={recommendation} />
            </Card>
          </StepCard>
        )}

        <div className="mt-7 grid grid-cols-2 gap-3">
          {step > 1 ? (
            <OutlineButton onClick={() => setStep((current) => current - 1)}>
              Kembali
            </OutlineButton>
          ) : (
            <Link
              className="rounded-2xl border border-[#159fb3] bg-white px-5 py-3.5 text-center font-bold text-[#087f8c]"
              to="/"
            >
              Batal
            </Link>
          )}
          <PrimaryButton
            disabled={!canContinue}
            onClick={() => {
              if (step < 4) setStep((current) => current + 1);
              else setConfirm(true);
            }}
          >
            {step === 4 ? 'Simpan Draft' : 'Lanjut'}
          </PrimaryButton>
        </div>
      </main>

      <BottomSheet
        onClose={() => setSheet(null)}
        open={sheet === 'district'}
        title="Pilih kecamatan"
      >
        <div className="space-y-3">
          {[
            ['WATANG_SAWITTO', 'Watang Sawitto'],
            ['PALETEANG', 'Paleteang'],
          ].map(([value, label]) => (
            <button
              className="w-full rounded-2xl border border-slate-200 p-4 text-left font-bold hover:bg-[#e6f7fa]"
              key={value}
              onClick={() => {
                const selected = value as ActiveDistrict;
                setDistrict(selected);
                setVillageId(villagesForDistrict(selected)[0].id);
                setLocationValidationStatus('NEEDS_OPERATOR_REVIEW');
                setSheet(null);
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        onClose={() => setSheet(null)}
        open={sheet === 'volume'}
        title="Pilih estimasi volume"
      >
        <div className="space-y-3">
          {volumeOptions.map((option) => (
            <button
              className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:bg-[#e6f7fa]"
              key={option.value}
              onClick={() => {
                setVolume(option.value);
                setSheet(null);
              }}
              type="button"
            >
              <span className="font-bold">{option.label}</span>
              <span className="mt-1 block text-xs text-slate-500">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <ConfirmModal
        description="Data akan disimpan sebagai draft pada perangkat ini dan belum dikirim ke operator."
        onCancel={() => setConfirm(false)}
        onConfirm={finish}
        open={confirm}
        title="Simpan draft pengajuan?"
      />
      <AppDialog
        confirmLabel="Mengerti"
        description={notice?.description ?? ''}
        icon="warning"
        onConfirm={() => setNotice(undefined)}
        open={Boolean(notice)}
        title={notice?.title ?? ''}
        tone={notice?.tone}
      />
    </div>
  );
}

function StepCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: 'pin' | 'camera' | 'spark' | 'ticket';
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-7">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e6f7fa] text-[#087f8c]">
        <AppIcon name={icon} />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-6">{children}</div>
    </Card>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
