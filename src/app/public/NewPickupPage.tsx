import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
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
  updatePublicTicket,
} from './public-data';
import { submitPublicTicket } from './public-ticket.repository';
import { reverseGeocode } from '../components/map/reverse-geocoding';
import { detectServiceArea } from '../../shared/regions/service-area-boundaries';
import { composeServiceAddress } from '../../shared/regions/location-address';
import { compressImage } from '../driver/firestore-proof-media';

type Volume = 'SMALL' | 'MEDIUM' | 'LARGE' | 'OVERSIZED';
const WIZARD_STORAGE_KEY = 'peduli-pinrang-pickup-wizard-v4';

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
  const { authUid, user } = useAuth();
  const savedProfile = getPublicProfile();
  const customer = user?.role === 'CUSTOMER' ? user : null;
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(
    customer?.addressText ?? savedProfile?.address ?? '',
  );
  const [district, setDistrict] = useState<ActiveDistrict | ''>(
    customer?.district ?? savedProfile?.district ?? '',
  );
  const [villageId, setVillageId] = useState(
    customer?.villageId ?? savedProfile?.villageId ?? '',
  );
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(
    customer?.location ?? savedProfile?.location,
  );
  const [locationAccuracyMeters, setLocationAccuracyMeters] =
    useState<number | undefined>(
      customer?.locationAccuracyMeters ?? savedProfile?.locationAccuracyMeters,
    );
  const [locationSource, setLocationSource] =
    useState<LocationSource>(
      customer?.locationSource ?? savedProfile?.locationSource ?? 'MANUAL_TEXT',
    );
  const [locationValidationStatus, setLocationValidationStatus] =
    useState<LocationValidationStatus>(
      customer?.locationValidationStatus ??
        savedProfile?.locationValidationStatus ??
        'UNKNOWN',
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
  const [photoFile, setPhotoFile] = useState<File>();
  const [wasteDescription, setWasteDescription] = useState('');
  const [wasteTypes, setWasteTypes] = useState<string[]>([]);
  const [serviceSource, setServiceSource] = useState('rumah_tangga');
  const [volume, setVolume] = useState<Volume>('MEDIUM');
  const [preferredTime, setPreferredTime] = useState('');
  const [accessNote, setAccessNote] = useState('mudah');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState(
    customer ? customer.name : savedProfile?.fullName ?? '',
  );
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState(
    customer ? customer.phoneNumber ?? '' : savedProfile?.phoneNumber ?? '',
  );
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sheet, setSheet] = useState<'district' | 'volume' | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw) as Record<string, unknown>;
        if (typeof draft.address === 'string') setAddress(draft.address);
        if (
          draft.district === 'WATANG_SAWITTO' ||
          draft.district === 'PALETEANG'
        ) {
          setDistrict(draft.district);
        }
        if (typeof draft.villageId === 'string') setVillageId(draft.villageId);
        if (
          draft.location &&
          typeof draft.location === 'object' &&
          'lat' in draft.location &&
          'lng' in draft.location
        ) {
          setLocation(draft.location as { lat: number; lng: number });
        }
        if (typeof draft.locationAccuracyMeters === 'number') {
          setLocationAccuracyMeters(draft.locationAccuracyMeters);
        }
        if (
          draft.locationSource === 'BROWSER_GPS' ||
          draft.locationSource === 'MANUAL_PIN' ||
          draft.locationSource === 'MANUAL_TEXT'
        ) {
          setLocationSource(draft.locationSource);
        }
        if (
          draft.locationValidationStatus === 'INSIDE_SERVICE_AREA' ||
          draft.locationValidationStatus === 'OUTSIDE_SERVICE_AREA' ||
          draft.locationValidationStatus === 'NEEDS_OPERATOR_REVIEW' ||
          draft.locationValidationStatus === 'UNKNOWN'
        ) {
          setLocationValidationStatus(draft.locationValidationStatus);
        }
        if (typeof draft.photo === 'string') setPhoto(draft.photo);
        if (typeof draft.wasteDescription === 'string') {
          setWasteDescription(draft.wasteDescription);
        }
        if (Array.isArray(draft.wasteTypes)) {
          setWasteTypes(
            draft.wasteTypes.filter(
              (item): item is string => typeof item === 'string',
            ),
          );
        }
        if (typeof draft.serviceSource === 'string') {
          setServiceSource(draft.serviceSource);
        }
        if (typeof draft.volume === 'string') setVolume(draft.volume as Volume);
        if (typeof draft.preferredTime === 'string') {
          setPreferredTime(draft.preferredTime);
        }
        if (typeof draft.accessNote === 'string') setAccessNote(draft.accessNote);
        if (typeof draft.notes === 'string') setNotes(draft.notes);
        if (typeof draft.customerName === 'string') {
          setCustomerName(draft.customerName);
        }
        if (typeof draft.customerPhoneNumber === 'string') {
          setCustomerPhoneNumber(draft.customerPhoneNumber);
        }
      } catch {
        localStorage.removeItem(WIZARD_STORAGE_KEY);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(
        WIZARD_STORAGE_KEY,
        JSON.stringify({
          address,
          district,
          villageId,
          location,
          locationAccuracyMeters,
          locationSource,
          locationValidationStatus,
          photo,
          wasteDescription,
          wasteTypes,
          serviceSource,
          volume,
          preferredTime,
          accessNote,
          notes,
          customerName,
          customerPhoneNumber,
        }),
      );
    }, 350);
    return () => window.clearTimeout(timer);
  }, [
    accessNote,
    address,
    customerName,
    customerPhoneNumber,
    district,
    location,
    locationAccuracyMeters,
    locationSource,
    locationValidationStatus,
    notes,
    photo,
    preferredTime,
    serviceSource,
    villageId,
    volume,
    wasteDescription,
    wasteTypes,
  ]);

  const recommendation =
    volume === 'LARGE' || volume === 'OVERSIZED'
      ? 'Angkut 1 kali jalan'
      : 'Jemput reguler';
  const canContinue =
    step === 1
      ? Boolean(photo) || wasteDescription.trim().length >= 10
      : step === 2
      ? address.trim().length >= 8 &&
        Boolean(district) &&
        Boolean(villageId) &&
        Boolean(location) &&
        locationValidationStatus === 'INSIDE_SERVICE_AREA'
      : step === 3
        ? wasteTypes.length > 0
        : step === 5
          ? customerName.trim().length >= 2 &&
            isValidIndonesianPhoneNumber(customerPhoneNumber) &&
            privacyAccepted
          : true;

  async function selectPhoto(file?: File) {
    if (!file) return;
    if (file.size > 10_485_760) {
      setNotice({
        title: 'Foto terlalu besar',
        description: 'Ukuran foto maksimal 10 MB. Pilih foto lain yang lebih kecil.',
        tone: 'warning',
      });
      return;
    }
    try {
      const compressed = await compressImage(file);
      setPhoto(compressed.dataUrl);
      setPhotoFile(
        new File([Uint8Array.from(compressed.bytes)], 'foto-sampah.jpg', {
          type: compressed.contentType,
        }),
      );
    } catch (error) {
      setNotice({
        title: 'Foto belum dapat dipakai',
        description:
          error instanceof Error
            ? error.message
            : 'Pilih foto JPEG, PNG, atau WebP yang lebih kecil.',
        tone: 'warning',
      });
    }
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

  async function finish() {
    if (
      !district ||
      !villageId ||
      isSubmitting
    ) {
      return;
    }
    setIsSubmitting(true);
    setConfirm(false);
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
      wasteDescription,
      wasteTypes,
      serviceSource,
      preferredTime,
      accessNote,
      photo,
    });
    if (!authUid || user?.role !== 'CUSTOMER' || !photoFile) {
      navigate(`/tickets/${ticket.id}`);
      setIsSubmitting(false);
      return;
    }
    try {
      const submitted = await submitPublicTicket(ticket, authUid, photoFile);
      updatePublicTicket(ticket.id, {
        code: submitted.ticketCode,
        deliveryStatus: 'SUBMITTED',
        remoteId: submitted.id,
        lastSyncError: undefined,
      });
      localStorage.removeItem(WIZARD_STORAGE_KEY);
      navigate(`/tickets/${ticket.id}`);
    } catch {
      updatePublicTicket(ticket.id, {
        deliveryStatus: 'PENDING_SYNC',
        lastSyncError:
          'Belum dapat dikirim. Periksa koneksi lalu coba kembali dari detail permintaan.',
      });
      navigate(`/tickets/${ticket.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        back={
          <Link
            aria-label="Kembali ke pusat layanan"
            className="grid min-h-12 min-w-12 place-items-center rounded-full text-xl text-[#087f8c]"
            to="/app"
          >
            &larr;
          </Link>
        }
        homeTo="/app"
        subtitle={`Langkah ${step} dari 6`}
        titleAsHeading={false}
        title="Ajukan Jemput"
        titleLink={false}
      />
      <main className="app-container max-w-2xl py-7">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
          <span>Langkah {step} dari 6</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
            Draft di perangkat
          </span>
        </div>
        <div className="mb-7 grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <span
              className={`h-2 rounded-full ${item <= step ? 'bg-[#087f8c]' : 'bg-slate-200'}`}
              key={item}
            />
          ))}
        </div>

        {step === 2 && (
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
              <span aria-hidden>v</span>
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

        {step === 1 && (
          <StepCard
            description="Ambil foto sampah. Jika belum bisa, tulis deskripsi singkat."
            icon="camera"
            title="Foto Sampah"
          >
            <PhotoUploadCard
              label="Ambil atau pilih foto"
              onChange={(file) => void selectPhoto(file)}
              preview={photo}
            />
            <label className="mt-4 block text-base font-bold">
              Deskripsi sampah
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 text-base font-normal outline-none focus:border-[#159fb3]"
                onChange={(event) => setWasteDescription(event.target.value)}
                placeholder="Contoh: tiga kantong plastik campuran dan kardus"
                value={wasteDescription}
              />
            </label>
            <p className="mt-2 text-sm text-slate-500">
              Foto atau deskripsi minimal 10 karakter wajib diisi.
            </p>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard
            description="Pilih perkiraan terdekat. Operator tetap akan memeriksa foto."
            icon="spark"
            title="Detail Sampah"
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
              <span aria-hidden>v</span>
            </button>
            <fieldset className="mt-5">
              <legend className="text-base font-bold">Jenis sampah</legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  ['plastik', 'Plastik/botol'],
                  ['kertas', 'Kardus/kertas'],
                  ['logam', 'Kaleng/logam'],
                  ['kaca', 'Kaca'],
                  ['organik', 'Organik'],
                  ['campuran', 'Campuran/perlu dicek'],
                ].map(([value, label]) => (
                  <label
                    className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-semibold"
                    key={value}
                  >
                    <input
                      checked={wasteTypes.includes(value)}
                      onChange={(event) =>
                        setWasteTypes((current) =>
                          event.target.checked
                            ? [...current, value]
                            : current.filter((item) => item !== value),
                        )
                      }
                      type="checkbox"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-5 block text-base font-bold">
              Sumber layanan
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base"
                onChange={(event) => setServiceSource(event.target.value)}
                value={serviceSource}
              >
                <option value="rumah_tangga">Rumah tangga</option>
                <option value="umkm">UMKM/toko</option>
                <option value="kantor_sekolah">Kantor/sekolah</option>
                <option value="event">Event/hajatan</option>
                <option value="tps3r">TPS3R/mitra</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </label>
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
            description="Jadwal final tetap dikonfirmasi operator sesuai rute dan ketersediaan petugas."
            icon="calendar"
            title="Waktu & Catatan"
          >
            <label className="block text-base font-bold">
              Waktu yang diharapkan
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-base"
                onChange={(event) => setPreferredTime(event.target.value)}
                type="datetime-local"
                value={preferredTime}
              />
            </label>
            <label className="mt-4 block text-base font-bold">
              Akses lokasi
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base"
                onChange={(event) => setAccessNote(event.target.value)}
                value={accessNote}
              >
                <option value="mudah">Mudah diakses</option>
                <option value="sempit">Jalan sempit</option>
                <option value="sulit">Akses sulit</option>
                <option value="konfirmasi">Perlu konfirmasi operator</option>
              </select>
            </label>
            <label className="mt-4 block text-base font-bold">
              Catatan untuk petugas
              <textarea
                className="mt-2 min-h-32 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 text-base font-normal outline-none focus:border-[#159fb3]"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contoh: rumah pagar hijau, ada pecahan kaca..."
                value={notes}
              />
            </label>
          </StepCard>
        )}

        {step === 5 && (
          <StepCard
            description="Data ini baru diminta di akhir agar Anda bisa fokus menjelaskan kebutuhan jemput."
            icon="user"
            title="Data Penghubung"
          >
            <label className="block text-base font-bold">
              Nama lengkap
              <input
                autoComplete="name"
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 text-base font-normal outline-none focus:border-[#159fb3]"
                maxLength={120}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Nama warga yang mengajukan"
                readOnly={user?.role === 'CUSTOMER'}
                required
                value={customerName}
              />
            </label>
            <label className="mt-4 block text-base font-bold">
              Nomor WhatsApp aktif
              <input
                autoComplete="tel"
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 text-base font-normal outline-none focus:border-[#159fb3]"
                inputMode="tel"
                onChange={(event) => setCustomerPhoneNumber(event.target.value)}
                placeholder="Contoh: 0812 3456 7890"
                readOnly={user?.role === 'CUSTOMER'}
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
            {user?.role === 'CUSTOMER' && (
              <p className="mt-2 text-sm text-slate-500">
                Identitas mengikuti profil akun. Perbarui melalui halaman
                profil bila ada perubahan.
              </p>
            )}
            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
              <input
                checked={privacyAccepted}
                className="mt-1 h-4 w-4 accent-[#087f8c]"
                onChange={(event) => setPrivacyAccepted(event.target.checked)}
                type="checkbox"
              />
              <span>
                Saya setuju nama, nomor WhatsApp, alamat, titik lokasi, dan foto
                digunakan hanya untuk memproses penjemputan sampah.
              </span>
            </label>
            {!user && (
              <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Sudah punya akun? <Link className="font-bold text-[#087f8c]" to="/auth?next=/pickup/new">Masuk</Link>.
                Anda tetap dapat melanjutkan tanpa akun.
              </p>
            )}
          </StepCard>
        )}

        {step === 6 && (
          <StepCard
            description="Periksa kembali sebelum menyimpan atau mengirim permintaan."
            icon="ticket"
            title="Konfirmasi"
          >
            <Card className="p-5 shadow-none">
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
              <Summary label="Jenis sampah" value={wasteTypes.join(', ')} />
              <Summary label="Waktu harapan" value={preferredTime || 'Fleksibel'} />
              <Summary label="Layanan" value={recommendation} />
            </Card>
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {!authUid || user?.role !== 'CUSTOMER' || !photoFile
                ? 'Permintaan akan disimpan sebagai draft perangkat. Kirim melalui WhatsApp agar operator menerimanya.'
                : 'Permintaan akan dikirim ke sistem dan menunggu verifikasi operator.'}
            </p>
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
              to="/app"
            >
              Batal
            </Link>
          )}
          <PrimaryButton
            disabled={!canContinue || isSubmitting}
            onClick={() => {
              if (step < 6) setStep((current) => current + 1);
              else setConfirm(true);
            }}
          >
            {step === 6
              ? isSubmitting
                ? 'Mengirim...'
                : 'Kirim Permintaan'
              : 'Lanjut'}
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
        description={
          authUid && user?.role === 'CUSTOMER'
            ? 'Permintaan akan dikirim ke operator. Jika koneksi terputus, data disimpan sebagai antrean dan dapat dikirim ulang.'
            : 'Draft akan disimpan di perangkat. Setelah itu, kirim detailnya melalui WhatsApp agar operator dapat memproses permintaan.'
        }
        onCancel={() => setConfirm(false)}
        onConfirm={() => void finish()}
        open={confirm}
        title="Kirim permintaan jemput?"
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
  icon: 'pin' | 'camera' | 'spark' | 'ticket' | 'calendar' | 'user';
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
