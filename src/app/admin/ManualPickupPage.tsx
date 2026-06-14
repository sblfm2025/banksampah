import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IMPACT_TAGS,
  IMPACT_TAG_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_MODELS,
  SERVICE_MODEL_LABELS,
} from '../../shared/constants/service-impact';
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
} from '../../shared/constants/services';
import {
  SERVICE_VILLAGES,
} from '../../shared/regions/service-areas';
import type { CreateManualPickupInput } from '../../shared/schemas/pickup-input.schema';
import { operatorRepository } from './operator.repository';

type ActiveDistrict = CreateManualPickupInput['district'];

function normalizePhone(value: string) {
  const digits = value.replaceAll(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

function optionalNumber(data: FormData, key: string) {
  const value = String(data.get(key) ?? '').trim();
  return value === '' ? undefined : Number(value);
}

export function ManualPickupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [district, setDistrict] =
    useState<ActiveDistrict>('WATANG_SAWITTO');
  const mutation = useMutation({
    mutationFn: (input: CreateManualPickupInput) =>
      operatorRepository.createManual(input),
    onSuccess: async (ticket) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['operator-summary'] }),
      ]);
      navigate(`/admin/tickets/${ticket.id}`);
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lat = optionalNumber(data, 'lat');
    const lng = optionalNumber(data, 'lng');
    mutation.mutate({
      customerName: String(data.get('customerName')),
      customerPhoneNumber: normalizePhone(
        String(data.get('customerPhoneNumber')),
      ),
      district,
      villageId: String(data.get('villageId')),
      addressText: String(data.get('addressText')),
      location:
        lat === undefined || lng === undefined ? undefined : { lat, lng },
      serviceType: String(
        data.get('serviceType'),
      ) as CreateManualPickupInput['serviceType'],
      serviceCategory: String(
        data.get('serviceCategory'),
      ) as CreateManualPickupInput['serviceCategory'],
      serviceModel: String(
        data.get('serviceModel'),
      ) as CreateManualPickupInput['serviceModel'],
      volumeLevel: String(
        data.get('volumeLevel'),
      ) as CreateManualPickupInput['volumeLevel'],
      wasteDescription:
        String(data.get('wasteDescription') ?? '').trim() || undefined,
      wasteTypes: String(data.get('wasteTypes') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      estimatedWeightKg: optionalNumber(data, 'estimatedWeightKg'),
      serviceFee: optionalNumber(data, 'serviceFee'),
      operationalCost: optionalNumber(data, 'operationalCost'),
      paidAmount: optionalNumber(data, 'paidAmount'),
      paymentStatus: String(
        data.get('paymentStatus'),
      ) as CreateManualPickupInput['paymentStatus'],
      impactTags: data.getAll(
        'impactTags',
      ) as CreateManualPickupInput['impactTags'],
    });
  }

  const villages = SERVICE_VILLAGES.filter(
    (village) => village.districtId === district,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <Link
          className="text-sm font-bold text-[#087f8c]"
          to="/admin/tickets"
        >
          Kembali ke permintaan
        </Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#159fb3]">
          Input operator
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">
          Buat permintaan dari WhatsApp
        </h1>
        <p className="mt-2 text-slate-600">
          Salin data yang sudah dikonfirmasi warga. Permintaan tetap masuk ke
          tahap verifikasi sebelum dijadwalkan.
        </p>
      </header>

      {mutation.isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {mutation.error.message}
        </p>
      )}

      <form className="space-y-6" onSubmit={submit}>
        <FormSection title="Identitas dan kontak">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nama lengkap" name="customerName" required />
            <TextField
              label="Nomor WhatsApp"
              name="customerPhoneNumber"
              placeholder="081234567890"
              required
            />
          </div>
        </FormSection>

        <FormSection title="Alamat jemput">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Kecamatan"
              name="district"
              onChange={(value) => setDistrict(value as ActiveDistrict)}
              options={[
                { value: 'WATANG_SAWITTO', label: 'Watang Sawitto' },
                { value: 'PALETEANG', label: 'Paleteang' },
              ]}
              value={district}
            />
            <SelectField
              label="Kelurahan"
              name="villageId"
              options={villages.map((village) => ({
                value: village.id,
                label: village.name,
              }))}
            />
          </div>
          <label className="mt-4 block text-sm font-bold">
            Alamat lengkap dan patokan
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3"
              name="addressText"
              placeholder="Nama jalan, nomor rumah, warna rumah, dan patokan terdekat"
              required
            />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField label="Latitude (opsional)" name="lat" type="number" />
            <TextField label="Longitude (opsional)" name="lng" type="number" />
          </div>
        </FormSection>

        <FormSection title="Kebutuhan layanan">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Jenis layanan"
              name="serviceType"
              options={SERVICE_TYPES.filter(
                (value) => value !== 'UNKNOWN',
              ).map((value) => ({
                value,
                label: SERVICE_TYPE_LABELS[value],
              }))}
            />
            <SelectField
              label="Perkiraan volume"
              name="volumeLevel"
              options={[
                { value: 'SMALL', label: 'Kecil' },
                { value: 'MEDIUM', label: 'Sedang' },
                { value: 'LARGE', label: 'Besar' },
                { value: 'OVERSIZED', label: 'Sangat besar' },
                { value: 'UNKNOWN', label: 'Belum diketahui' },
              ]}
            />
            <SelectField
              label="Kategori"
              name="serviceCategory"
              options={SERVICE_CATEGORIES.map((value) => ({
                value,
                label: SERVICE_CATEGORY_LABELS[value],
              }))}
            />
            <SelectField
              label="Model layanan"
              name="serviceModel"
              options={SERVICE_MODELS.map((value) => ({
                value,
                label: SERVICE_MODEL_LABELS[value],
              }))}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Jenis sampah"
              name="wasteTypes"
              placeholder="Plastik, kardus, organik"
            />
            <TextField
              label="Estimasi berat kg"
              name="estimatedWeightKg"
              type="number"
            />
          </div>
          <label className="mt-4 block text-sm font-bold">
            Catatan kebutuhan
            <textarea
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3"
              name="wasteDescription"
              placeholder="Ringkasan foto, volume, akses kendaraan, atau waktu yang diminta warga"
            />
          </label>
        </FormSection>

        <FormSection title="Biaya dan dampak">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="Biaya layanan" name="serviceFee" type="number" />
            <TextField
              label="Biaya operasional"
              name="operationalCost"
              type="number"
            />
            <TextField label="Sudah dibayar" name="paidAmount" type="number" />
            <SelectField
              label="Pembayaran"
              name="paymentStatus"
              options={PAYMENT_STATUSES.map((value) => ({
                value,
                label: PAYMENT_STATUS_LABELS[value],
              }))}
            />
          </div>
          <fieldset className="mt-5">
            <legend className="text-sm font-bold">Tag dampak</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {IMPACT_TAGS.map((tag) => (
                <label className="flex items-center gap-2 text-sm" key={tag}>
                  <input
                    defaultChecked={tag === 'pengurangan_sampah'}
                    name="impactTags"
                    type="checkbox"
                    value={tag}
                  />
                  {IMPACT_TAG_LABELS[tag]}
                </label>
              ))}
            </div>
          </fieldset>
        </FormSection>

        <button
          className="w-full rounded-xl bg-[#159fb3] px-5 py-4 font-bold text-white disabled:opacity-50"
          disabled={mutation.isPending}
          type="submit"
        >
          {mutation.isPending
            ? 'Menyimpan permintaan...'
            : 'Simpan dan buka detail'}
        </button>
      </form>
    </div>
  );
}

function FormSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  name,
  placeholder,
  required,
  type = 'text',
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        className="mt-2 w-full rounded-xl border border-slate-300 p-3"
        min={type === 'number' ? 0 : undefined}
        name={name}
        placeholder={placeholder}
        required={required}
        step={type === 'number' ? 'any' : undefined}
        type={type}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value?: string;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <select
        className="mt-2 w-full rounded-xl border border-slate-300 p-3"
        name={name}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
