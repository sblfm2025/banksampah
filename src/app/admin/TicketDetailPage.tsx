import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DISTRICT_LABELS } from '../../shared/constants/districts';
import { SERVICE_TYPE_LABELS } from '../../shared/constants/services';
import {
  DATA_QUALITY_LABELS,
  IMPACT_TAGS,
  IMPACT_TAG_LABELS,
  PARTNER_DESTINATIONS,
  PARTNER_DESTINATION_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_MODELS,
  SERVICE_MODEL_LABELS,
} from '../../shared/constants/service-impact';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import { operatorRepository } from './operator.repository';
import { StatusBadge } from './StatusBadge';
import {
  loadPickupProof,
} from './pickup-proof-media';
import { loadCustomerWasteMedia } from '../../client/customer-waste-media';
import { getVillage } from '../../shared/regions/service-areas';
import { AppDialog } from '../ui/components';

type ScheduleInput = Parameters<typeof operatorRepository.schedule>[1];
type AssignInput = Parameters<typeof operatorRepository.assignDriver>[1];
type PendingAction =
  | { kind: 'confirm' }
  | { kind: 'reject'; reason: string }
  | { kind: 'schedule'; input: ScheduleInput }
  | { kind: 'assign'; input: AssignInput };

export function TicketDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<PendingAction>();
  const ticket = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => operatorRepository.getTicket(id!),
    enabled: Boolean(id),
  });
  const drivers = useQuery({
    queryKey: ['drivers'],
    queryFn: () => operatorRepository.listDrivers(),
  });
  const proof = useQuery({
    queryKey: ['pickup-proof', id],
    queryFn: () => loadPickupProof(id!),
    enabled: Boolean(id),
  });
  const intakePhotos = useQuery({
    queryKey: ['customer-waste-media', id, ticket.data?.intakePhotoMediaIds],
    queryFn: () =>
      loadCustomerWasteMedia(ticket.data?.intakePhotoMediaIds),
    enabled: Boolean(ticket.data?.intakePhotoMediaIds?.length),
  });

  async function refresh(updated: PickupRequest) {
    queryClient.setQueryData(['ticket', updated.id], updated);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tickets'] }),
      queryClient.invalidateQueries({ queryKey: ['operator-summary'] }),
    ]);
  }

  const statusMutation = useMutation({
    mutationFn: (input: Parameters<typeof operatorRepository.updateStatus>[1]) =>
      operatorRepository.updateStatus(id!, input),
    onSuccess: refresh,
  });
  const scheduleMutation = useMutation({
    mutationFn: (input: Parameters<typeof operatorRepository.schedule>[1]) =>
      operatorRepository.schedule(id!, input),
    onSuccess: refresh,
  });
  const assignMutation = useMutation({
    mutationFn: (input: Parameters<typeof operatorRepository.assignDriver>[1]) =>
      operatorRepository.assignDriver(id!, input),
    onSuccess: refresh,
  });
  const impactMutation = useMutation({
    mutationFn: (input: Parameters<typeof operatorRepository.updateImpact>[1]) =>
      operatorRepository.updateImpact(id!, input),
    onSuccess: refresh,
  });

  if (ticket.isLoading) {
    return <p className="text-slate-500">Memuat detail permintaan...</p>;
  }
  if (ticket.isError || !ticket.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
        Permintaan tidak dapat dimuat.
      </div>
    );
  }

  const data = ticket.data;
  const mutationError =
    statusMutation.error ??
    scheduleMutation.error ??
    assignMutation.error ??
    impactMutation.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            className="text-sm font-semibold text-green-700"
            to="/admin/tickets"
          >
            Kembali ke permintaan
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{data.ticketCode}</h1>
          <div className="mt-3">
            <StatusBadge status={data.status} />
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Masuk {formatDateTime(data.createdAt)}
        </p>
      </div>

      {mutationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {mutationError.message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <InfoSection title="Informasi Customer">
            <DefinitionGrid
              items={[
                ['Nama', data.customerName ?? 'Belum diketahui'],
                ['Nomor WhatsApp', data.customerPhoneNumber],
                ['Kecamatan', DISTRICT_LABELS[data.district]],
                [
                  'Kelurahan',
                  getVillage(data.villageId)?.name ?? data.village ?? '-',
                ],
                ['Alamat', data.addressText ?? 'Belum ada alamat'],
                [
                  'Sumber lokasi',
                  data.locationSource ?? 'Belum tercatat',
                ],
              ]}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white"
                href={`https://wa.me/${data.customerPhoneNumber}`}
                rel="noreferrer"
                target="_blank"
              >
                Buka WhatsApp
              </a>
              {data.location && (
                <a
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
                  href={`https://www.google.com/maps?q=${data.location.lat},${data.location.lng}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Buka Maps
                </a>
              )}
            </div>
          </InfoSection>

          <InfoSection title="Hasil Analisis AI">
            {data.aiAnalysis ? (
              <>
                <DefinitionGrid
                  items={[
                    ['Intent', data.aiAnalysis.intent],
                    ['Volume', data.aiAnalysis.volumeLevel],
                    ['Estimasi bak', data.aiAnalysis.tricycleLoadEstimate],
                    [
                      'Rekomendasi',
                      data.aiAnalysis.recommendedServiceType,
                    ],
                    [
                      'Confidence',
                      `${Math.round(data.aiAnalysis.confidence * 100)}%`,
                    ],
                    [
                      'Jenis sampah',
                      data.aiAnalysis.detectedWasteTypes.join(', '),
                    ],
                  ]}
                />
                <div className="mt-5 rounded-xl bg-orange-50 p-4 text-orange-950">
                  <p className="text-xs font-bold uppercase tracking-wide">
                    Ringkasan Operator
                  </p>
                  <p className="mt-2">
                    {data.aiAnalysis.operatorSummary}
                  </p>
                </div>
                {data.aiAnalysis.safetyFlags[0] !== 'NONE' && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
                    Safety flags: {data.aiAnalysis.safetyFlags.join(', ')}
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-500">Belum ada hasil analisis AI.</p>
            )}
          </InfoSection>

          <InfoSection title="Foto Sampah">
            {intakePhotos.isLoading ? (
              <p className="text-slate-500">Memuat foto sampah...</p>
            ) : intakePhotos.isError ? (
              <p className="text-red-700">Foto sampah tidak dapat dimuat.</p>
            ) : data.photoUrls.length === 0 &&
              (intakePhotos.data?.length ?? 0) === 0 ? (
              <p className="text-slate-500">Belum ada foto tersimpan.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {intakePhotos.data?.map((url, index) => (
                  <img
                    alt="Foto sampah dari warga"
                    className="h-52 w-full rounded-xl border border-slate-200 object-cover"
                    key={`intake-${index}`}
                    src={url}
                  />
                ))}
                {data.photoUrls.map((url) =>
                  url.startsWith('http') ? (
                    <a
                      className="overflow-hidden rounded-xl border border-slate-200"
                      href={url}
                      key={url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <img
                        alt="Foto sampah dari customer"
                        className="h-52 w-full object-cover"
                        src={url}
                      />
                    </a>
                  ) : (
                    <div
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
                      key={url}
                    >
                      Foto tersimpan aman di Storage. Preview membutuhkan signed
                      URL dari backend.
                    </div>
                  ),
                )}
              </div>
            )}
          </InfoSection>

          <InfoSection title="Bukti Pickup Petugas">
            {proof.isLoading ? (
              <p className="text-slate-500">Memuat bukti pickup...</p>
            ) : proof.isError ? (
              <p className="text-red-700">Bukti pickup tidak dapat dimuat.</p>
            ) : proof.data ? (
              <div className="space-y-5">
                <ProofGallery label="Sebelum diangkut" urls={proof.data.before} />
                <ProofGallery label="Setelah diangkut" urls={proof.data.after} />
                <DefinitionGrid
                  items={[
                    ['Hasil aktual', proof.data.result ?? '-'],
                    ['Catatan petugas', proof.data.notes ?? '-'],
                  ]}
                />
              </div>
            ) : (
              <p className="text-slate-500">
                Belum ada bukti pickup dari petugas.
              </p>
            )}
          </InfoSection>
        </div>

        <aside className="space-y-5">
          <InfoSection title="Data Operasional">
            <DefinitionGrid
              items={[
                ['Layanan', SERVICE_TYPE_LABELS[data.serviceType]],
                ['Volume', data.volumeLevel],
                ['Estimasi bak', data.tricycleLoadEstimate],
                ['Tanggal', data.scheduledDate ?? 'Belum dijadwalkan'],
                [
                  'Jam',
                  data.scheduledTimeWindow
                    ? `${data.scheduledTimeWindow.start}-${data.scheduledTimeWindow.end}`
                    : 'Belum ditentukan',
                ],
                ['Petugas', data.assignedDriverName ?? 'Belum ditugaskan'],
              ]}
            />
          </InfoSection>

          <ImpactForm
            disabled={impactMutation.isPending}
            ticket={data}
            onSubmit={(input) => impactMutation.mutate(input)}
          />

          {(data.status === 'NEW' ||
            data.status === 'NEEDS_OPERATOR_REVIEW') && (
            <ConfirmActions
              disabled={statusMutation.isPending}
              onConfirm={() => setPendingAction({ kind: 'confirm' })}
              onReject={(reason) => setPendingAction({ kind: 'reject', reason })}
            />
          )}

          {data.status === 'CONFIRMED' && (
            <ScheduleForm
              disabled={scheduleMutation.isPending}
              onSubmit={(input) =>
                setPendingAction({ kind: 'schedule', input })
              }
            />
          )}

          {data.status === 'SCHEDULED' && (
            <AssignForm
              disabled={assignMutation.isPending}
              drivers={drivers.data ?? []}
              onSubmit={(input) => setPendingAction({ kind: 'assign', input })}
            />
          )}
        </aside>
      </div>
      <AppDialog
        busy={
          statusMutation.isPending ||
          scheduleMutation.isPending ||
          assignMutation.isPending
        }
        cancelLabel="Batal"
        confirmLabel={dialogContent(pendingAction).confirmLabel}
        description={dialogContent(pendingAction).description}
        icon={dialogContent(pendingAction).icon}
        onCancel={() => setPendingAction(undefined)}
        onConfirm={() => {
          if (!pendingAction) return;
          const close = () => setPendingAction(undefined);
          if (pendingAction.kind === 'confirm') {
            statusMutation.mutate({ status: 'CONFIRMED' }, { onSettled: close });
          } else if (pendingAction.kind === 'reject') {
            statusMutation.mutate(
              {
                status: 'REJECTED',
                rejectedReason: pendingAction.reason,
              },
              { onSettled: close },
            );
          } else if (pendingAction.kind === 'schedule') {
            scheduleMutation.mutate(pendingAction.input, { onSettled: close });
          } else {
            assignMutation.mutate(pendingAction.input, { onSettled: close });
          }
        }}
        open={Boolean(pendingAction)}
        title={dialogContent(pendingAction).title}
        tone={dialogContent(pendingAction).tone}
      />
    </div>
  );
}

function dialogContent(action?: PendingAction) {
  if (action?.kind === 'reject') {
    return {
      title: 'Tolak permintaan ini?',
      description:
        'Permintaan akan ditandai ditolak dan alasan penolakan dapat dilihat pada riwayat layanan.',
      confirmLabel: 'Ya, tolak permintaan',
      tone: 'danger' as const,
      icon: 'warning' as const,
    };
  }
  if (action?.kind === 'schedule') {
    return {
      title: 'Simpan jadwal pickup?',
      description:
        'Tanggal dan jam yang dipilih akan menjadi jadwal operasional untuk permintaan ini.',
      confirmLabel: 'Simpan jadwal',
      tone: 'primary' as const,
      icon: 'calendar' as const,
    };
  }
  if (action?.kind === 'assign') {
    return {
      title: 'Tugaskan petugas?',
      description:
        'Petugas terpilih akan menerima permintaan ini pada daftar tugas pickup.',
      confirmLabel: 'Tugaskan',
      tone: 'primary' as const,
      icon: 'truck' as const,
    };
  }
  return {
    title: 'Konfirmasi permintaan ini?',
    description:
      'Permintaan akan lolos verifikasi operator dan dapat dilanjutkan ke penjadwalan pickup.',
    confirmLabel: 'Konfirmasi permintaan',
    tone: 'success' as const,
    icon: 'check' as const,
  };
}

function ProofGallery({ label, urls }: { label: string; urls: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold">{label}</h3>
      {urls.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Tidak ada foto.</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {urls.map((url, index) => (
            <a
              className="overflow-hidden rounded-xl border border-slate-200"
              href={url}
              key={`${label}-${index}`}
              rel="noreferrer"
              target="_blank"
            >
              <img
                alt={`${label} ${index + 1}`}
                className="h-52 w-full object-cover"
                loading="lazy"
                src={url}
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DefinitionGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </dt>
          <dd className="mt-1 font-medium text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ConfirmActions({
  disabled,
  onConfirm,
  onReject,
}: {
  disabled: boolean;
  onConfirm: () => void;
  onReject: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold">Verifikasi Operator</h2>
      <button
        className="mt-4 w-full rounded-xl bg-green-700 px-4 py-3 font-bold text-white disabled:opacity-50"
        disabled={disabled}
        onClick={onConfirm}
        type="button"
      >
        Konfirmasi Permintaan
      </button>
      <textarea
        aria-label="Alasan penolakan"
        className="mt-4 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm"
        onChange={(event) => setReason(event.target.value)}
        placeholder="Alasan wajib jika permintaan ditolak"
        value={reason}
      />
      <button
        className="mt-2 w-full rounded-xl border border-red-300 px-4 py-3 font-bold text-red-700 disabled:opacity-50"
        disabled={disabled || reason.trim().length === 0}
        onClick={() => onReject(reason)}
        type="button"
      >
        Tolak Permintaan
      </button>
    </section>
  );
}

function ScheduleForm({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (
    input: Parameters<typeof operatorRepository.schedule>[1],
  ) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      scheduledDate: String(data.get('date')),
      scheduledTimeWindow: {
        start: String(data.get('start')),
        end: String(data.get('end')),
      },
      operatorNotes: String(data.get('notes') || '') || undefined,
    });
  }

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={submit}
    >
      <h2 className="font-bold">Jadwalkan Pickup</h2>
      <label className="mt-4 block text-sm font-semibold">
        Tanggal
        <input
          className="mt-1 w-full rounded-xl border border-slate-300 p-2"
          min={new Date().toISOString().slice(0, 10)}
          name="date"
          required
          type="date"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold">
          Mulai
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 p-2"
            name="start"
            required
            type="time"
          />
        </label>
        <label className="text-sm font-semibold">
          Selesai
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 p-2"
            name="end"
            required
            type="time"
          />
        </label>
      </div>
      <textarea
        className="mt-3 min-h-20 w-full rounded-xl border border-slate-300 p-2 text-sm"
        name="notes"
        placeholder="Catatan operator"
      />
      <button
        className="mt-3 w-full rounded-xl bg-green-700 px-4 py-3 font-bold text-white disabled:opacity-50"
        disabled={disabled}
        type="submit"
      >
        Simpan Jadwal
      </button>
    </form>
  );
}

function AssignForm({
  disabled,
  drivers,
  onSubmit,
}: {
  disabled: boolean;
  drivers: Array<{ id: string; name: string; isActive: boolean }>;
  onSubmit: (input: Parameters<typeof operatorRepository.assignDriver>[1]) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const driverId = String(data.get('driverId'));
    const driver = drivers.find((item) => item.id === driverId);
    if (driver) onSubmit({ driverId, driverName: driver.name });
  }

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={submit}
    >
      <h2 className="font-bold">Assign Petugas</h2>
      <select
        className="mt-4 w-full rounded-xl border border-slate-300 p-3"
        name="driverId"
        required
      >
        <option value="">Pilih petugas aktif</option>
        {drivers
          .filter((driver) => driver.isActive)
          .map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name}
            </option>
          ))}
      </select>
      <button
        className="mt-3 w-full rounded-xl bg-indigo-700 px-4 py-3 font-bold text-white disabled:opacity-50"
        disabled={disabled}
        type="submit"
      >
        Tugaskan Petugas
      </button>
    </form>
  );
}

function ImpactForm({
  disabled,
  ticket,
  onSubmit,
}: {
  disabled: boolean;
  ticket: PickupRequest;
  onSubmit: (
    input: Parameters<typeof operatorRepository.updateImpact>[1],
  ) => void;
}) {
  function optionalNumber(data: FormData, key: string) {
    const value = String(data.get(key) ?? '').trim();
    return value === '' ? undefined : Number(value);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      serviceCategory: String(data.get('serviceCategory')) as NonNullable<
        PickupRequest['serviceCategory']
      >,
      serviceModel: String(data.get('serviceModel')) as NonNullable<
        PickupRequest['serviceModel']
      >,
      wasteTypes: String(data.get('wasteTypes') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      estimatedWeightKg: optionalNumber(data, 'estimatedWeightKg'),
      finalWeightKg: optionalNumber(data, 'finalWeightKg'),
      dataQuality: String(data.get('dataQuality')) as NonNullable<
        PickupRequest['dataQuality']
      >,
      partnerDestination:
        (String(data.get('partnerDestination') ?? '') as NonNullable<
          PickupRequest['partnerDestination']
        >) || undefined,
      serviceFee: optionalNumber(data, 'serviceFee'),
      operationalCost: optionalNumber(data, 'operationalCost'),
      paidAmount: optionalNumber(data, 'paidAmount'),
      paymentStatus: String(data.get('paymentStatus')) as NonNullable<
        PickupRequest['paymentStatus']
      >,
      impactTags: data.getAll('impactTags') as NonNullable<
        PickupRequest['impactTags']
      >,
    });
  }

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={submit}
    >
      <h2 className="font-bold">Klasifikasi & Dampak</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Data ini menjadi dasar laporan sosial, ekonomi, lingkungan, dan mitra.
      </p>
      <SelectField
        defaultValue={ticket.serviceCategory ?? 'warga'}
        label="Kategori layanan"
        name="serviceCategory"
        options={SERVICE_CATEGORIES.map((value) => ({
          value,
          label: SERVICE_CATEGORY_LABELS[value],
        }))}
      />
      <SelectField
        defaultValue={ticket.serviceModel ?? 'gratis'}
        label="Model layanan"
        name="serviceModel"
        options={SERVICE_MODELS.map((value) => ({
          value,
          label: SERVICE_MODEL_LABELS[value],
        }))}
      />
      <label className="mt-3 block text-sm font-semibold">
        Jenis sampah
        <input
          className="mt-1 w-full rounded-xl border border-slate-300 p-3"
          defaultValue={(ticket.wasteTypes ?? []).join(', ')}
          name="wasteTypes"
          placeholder="Plastik, kardus, organik"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField
          defaultValue={ticket.estimatedWeightKg}
          label="Estimasi kg"
          name="estimatedWeightKg"
        />
        <NumberField
          defaultValue={ticket.finalWeightKg}
          label="Berat akhir kg"
          name="finalWeightKg"
        />
      </div>
      <SelectField
        defaultValue={ticket.dataQuality ?? 'estimated_by_operator'}
        label="Kualitas data"
        name="dataQuality"
        options={Object.entries(DATA_QUALITY_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
      />
      <SelectField
        defaultValue={ticket.partnerDestination ?? ''}
        label="Tujuan sampah"
        name="partnerDestination"
        options={[
          { value: '', label: 'Belum ditentukan' },
          ...PARTNER_DESTINATIONS.map((value) => ({
            value,
            label: PARTNER_DESTINATION_LABELS[value],
          })),
        ]}
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <NumberField
          defaultValue={ticket.serviceFee}
          label="Biaya layanan"
          name="serviceFee"
        />
        <NumberField
          defaultValue={ticket.operationalCost}
          label="Biaya operasional"
          name="operationalCost"
        />
        <NumberField
          defaultValue={ticket.paidAmount}
          label="Sudah dibayar"
          name="paidAmount"
        />
      </div>
      <SelectField
        defaultValue={ticket.paymentStatus ?? 'gratis'}
        label="Status pembayaran"
        name="paymentStatus"
        options={PAYMENT_STATUSES.map((value) => ({
          value,
          label: PAYMENT_STATUS_LABELS[value],
        }))}
      />
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Tag dampak</legend>
        <div className="mt-2 grid gap-2">
          {IMPACT_TAGS.map((tag) => (
            <label className="flex items-center gap-2 text-sm" key={tag}>
              <input
                defaultChecked={(ticket.impactTags ?? [
                  'pengurangan_sampah',
                ]).includes(tag)}
                name="impactTags"
                type="checkbox"
                value={tag}
              />
              {IMPACT_TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        className="mt-5 w-full rounded-xl bg-[#159fb3] px-4 py-3 font-bold text-white disabled:opacity-50"
        disabled={disabled}
        type="submit"
      >
        {disabled ? 'Menyimpan...' : 'Simpan klasifikasi'}
      </button>
    </form>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: string;
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="mt-3 block text-sm font-semibold">
      {label}
      <select
        className="mt-1 w-full rounded-xl border border-slate-300 p-3"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  defaultValue,
  label,
  name,
}: {
  defaultValue?: number;
  label: string;
  name: string;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-slate-300 p-3"
        defaultValue={defaultValue}
        min="0"
        name={name}
        step="0.1"
        type="number"
      />
    </label>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Makassar',
  }).format(new Date(value));
}
