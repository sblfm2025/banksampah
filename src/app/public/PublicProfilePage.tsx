import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { DISTRICT_LABELS } from '../../shared/constants/districts';
import type { ActiveDistrict } from '../../shared/regions/region.types';
import {
  getVillage,
  villagesForDistrict,
} from '../../shared/regions/service-areas';
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
      'Siapkan foto sampah yang jelas, alamat lengkap, titik lokasi, dan nomor WhatsApp aktif. Permintaan web masih tersimpan sebagai draft lokal sampai kanal pengiriman resmi diaktifkan.',
  },
  terms: {
    title: 'Ketentuan layanan pilot',
    description:
      'Layanan awal hanya untuk Watang Sawitto dan Paleteang. Jadwal, kapasitas angkut, serta penanganan sampah berbahaya tetap memerlukan pemeriksaan operator.',
  },
  about: {
    title: 'Tentang aplikasi',
    description:
      'Jemput Sampah Pinrang membantu warga menyiapkan permintaan penjemputan dan membantu operator mengelola layanan secara lebih tertib.',
  },
} as const;

type InformationKey = keyof typeof information;

export function PublicProfilePage() {
  const initial = getPublicProfile();
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [district, setDistrict] = useState<ActiveDistrict | ''>(
    initial?.district ?? '',
  );
  const [villageId, setVillageId] = useState(initial?.villageId ?? '');
  const [message, setMessage] = useState('');
  const [openInformation, setOpenInformation] = useState<InformationKey>();
  const valid =
    fullName.trim().length >= 2 &&
    isValidIndonesianPhoneNumber(phoneNumber) &&
    address.trim().length >= 8 &&
    Boolean(district && villageId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || !district) return;
    savePublicProfile({
      fullName,
      phoneNumber,
      address,
      district,
      villageId,
    });
    setPhoneNumber(normalizeIndonesianPhoneNumber(phoneNumber));
    setMessage('Profil lokal berhasil disimpan.');
  }

  return (
    <>
      <AppHeader subtitle="Identitas dan preferensi lokal" title="Profil" />
      <main className="app-container space-y-5 py-7">
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e6f7fa] text-[#087f8c]">
            <AppIcon name="user" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-extrabold">
              {fullName.trim() || 'Warga Pinrang'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Profil tersimpan hanya di perangkat ini
            </p>
          </div>
        </Card>

        <form onSubmit={submit}>
          <Card className="p-5 sm:p-6">
            <div>
              <h2 className="font-extrabold">Data utama</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Data ini akan mengisi otomatis permintaan jemput berikutnya.
              </p>
            </div>
            {message && (
              <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
                {message}
              </p>
            )}
            <ProfileField
              autoComplete="name"
              label="Nama lengkap"
              onChange={setFullName}
              placeholder="Nama warga"
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
              Alamat utama
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-[#d9e2e7] bg-white p-4 font-normal outline-none focus:border-[#159fb3]"
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Nama jalan, lingkungan, dan patokan rumah"
                value={address}
              />
            </label>
            {district && villageId && (
              <p className="mt-3 text-xs text-slate-500">
                Wilayah tersimpan: {getVillage(villageId)?.name},{' '}
                {DISTRICT_LABELS[district]}
              </p>
            )}
            <PrimaryButton className="mt-5 w-full" disabled={!valid} type="submit">
              Simpan Profil
            </PrimaryButton>
          </Card>
        </form>

        <Card className="divide-y divide-slate-100 px-5">
          <InformationButton
            label="Bantuan"
            onClick={() => setOpenInformation('help')}
            value="Panduan menggunakan layanan"
          />
          <InformationButton
            label="Syarat dan Ketentuan"
            onClick={() => setOpenInformation('terms')}
            value="Ketentuan layanan pilot"
          />
          <InformationButton
            label="Tentang Aplikasi"
            onClick={() => setOpenInformation('about')}
            value="Jemput Sampah Pinrang"
          />
        </Card>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Menghapus data browser atau memakai perangkat lain akan menghilangkan
          profil dan draft lokal ini.
        </div>

        <Link
          className="block rounded-2xl border border-[#159fb3] bg-white px-5 py-4 text-center font-bold text-[#087f8c]"
          to="/login"
        >
          Masuk sebagai operator atau petugas
        </Link>
      </main>

      <AppDialog
        description={
          openInformation ? information[openInformation].description : ''
        }
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
