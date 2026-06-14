import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import {
  ACTUAL_TRIP_RESULTS,
  type CompletePickupInput,
} from '../../shared/schemas/pickup-proof.schema';
import {
  PARTNER_DESTINATIONS,
  PARTNER_DESTINATION_LABELS,
} from '../../shared/constants/service-impact';
import { useAuth } from '../auth/auth-context';
import { getVillage } from '../../shared/regions/service-areas';
import { StatusBadge } from '../admin/StatusBadge';
import {
  cachePickup,
  enqueueCompletion,
  getCachedPickup,
} from './driver-offline';
import {
  driverRepository,
  proofStorageEnabled,
  ProofStorageUnavailableError,
} from './driver.repository';
import { AppDialog } from '../ui/components';
import { loadCustomerWasteMedia } from '../../client/customer-waste-media';

const resultLabels: Record<
  CompletePickupInput['actualTripResult'],
  string
> = {
  COMPLETED_ONE_TRIP: 'Selesai 1 Trip',
  PARTIAL_PICKUP: 'Sebagian Terangkut',
  EXTRA_TRIP_REQUIRED: 'Butuh Extra Trip',
  CUSTOMER_NOT_AVAILABLE: 'Customer Tidak Ada',
  WASTE_NOT_READY: 'Sampah Belum Siap',
  LOCATION_NOT_FOUND: 'Lokasi Tidak Ditemukan',
  ACCESS_BLOCKED: 'Akses Terhalang',
  HAZARDOUS_WASTE_FOUND: 'Ditemukan Limbah B3/Berbahaya',
  CANCELLED_ON_SITE: 'Batal di Lokasi',
};

export function DriverPickupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { refreshPending } = useOutletContext<{
    refreshPending: () => Promise<void>;
  }>();
  const queryClient = useQueryClient();
  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [afterFiles, setAfterFiles] = useState<File[]>([]);
  const [formMessage, setFormMessage] = useState('');
  const [confirmStart, setConfirmStart] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
  }>();
  const pickup = useQuery({
    queryKey: ['driver-pickup', id],
    queryFn: async () => {
      try {
        const data = await driverRepository.getPickup(id!, user!.id);
        await cachePickup(data);
        return { data, cached: false };
      } catch {
        const cached = await getCachedPickup(id!);
        if (!cached) throw new Error('Pickup tidak tersedia offline.');
        return { data: cached, cached: true };
      }
    },
    enabled: Boolean(id && user),
  });
  const start = useMutation({
    mutationFn: () => driverRepository.start(id!, user!.id),
    onSuccess: async (ticket) => {
      await cachePickup(ticket);
      queryClient.setQueryData(['driver-pickup', id], {
        data: ticket,
        cached: false,
      });
    },
  });
  const complete = useMutation({
    mutationFn: async (input: {
      result: CompletePickupInput['actualTripResult'];
      notes?: string;
      finalWeightKg?: number;
      partnerDestination?: CompletePickupInput['partnerDestination'];
    }) => {
      if (beforeFiles.length === 0 && afterFiles.length === 0) {
        throw new Error('Minimal satu bukti foto wajib dipilih.');
      }

      try {
        const [beforePhotoUrls, afterPhotoUrls] = await Promise.all([
          driverRepository.uploadProof(
            user!.id,
            id!,
            'before',
            beforeFiles,
          ),
          driverRepository.uploadProof(user!.id, id!, 'after', afterFiles),
        ]);
        return await driverRepository.complete(id!, user!.id, {
          actualTripResult: input.result,
          beforePhotoUrls,
          afterPhotoUrls,
          finalWeightKg: input.finalWeightKg,
          partnerDestination: input.partnerDestination,
          driverNotes: input.notes,
        });
      } catch (error) {
        if (error instanceof ProofStorageUnavailableError) throw error;

        await enqueueCompletion({
          ticketId: id!,
          driverId: user!.id,
          actualTripResult: input.result,
          driverNotes: input.notes,
          finalWeightKg: input.finalWeightKg,
          partnerDestination: input.partnerDestination,
          beforeFiles,
          afterFiles,
          lastError: error instanceof Error ? error.message : undefined,
        });
        window.dispatchEvent(new CustomEvent('driver-queue-changed'));
        await refreshPending();
        throw new Error(
          'Koneksi gagal. Hasil disimpan sebagai pending dan akan dicoba ulang.',
          { cause: error },
        );
      }
    },
    onSuccess: async (ticket) => {
      await cachePickup(ticket);
      queryClient.setQueryData(['driver-pickup', id], {
        data: ticket,
        cached: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ['driver-pickups', user?.id],
      });
      setFormMessage('Hasil pickup berhasil disimpan.');
    },
  });
  const currentTicket = pickup.data?.data;
  const intakePhotos = useQuery({
    queryKey: [
      'driver-customer-waste-media',
      id,
      currentTicket?.intakePhotoMediaIds,
    ],
    queryFn: () => loadCustomerWasteMedia(currentTicket?.intakePhotoMediaIds),
    enabled: Boolean(currentTicket?.intakePhotoMediaIds?.length),
  });

  if (pickup.isLoading) return <p>Memuat pickup...</p>;
  if (pickup.isError || !pickup.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        {pickup.error?.message ?? 'Pickup tidak ditemukan.'}
      </div>
    );
  }

  const ticket = pickup.data.data;
  const active = ['ASSIGNED', 'IN_PROGRESS'].includes(ticket.status);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const finalWeight = Number(data.get('finalWeightKg') || 0);
    const partnerDestination = String(data.get('partnerDestination') || '');
    complete.mutate({
      result: String(data.get('result')) as CompletePickupInput['actualTripResult'],
      notes: String(data.get('notes') || '') || undefined,
      finalWeightKg: finalWeight > 0 ? finalWeight : undefined,
      partnerDestination: partnerDestination
        ? (partnerDestination as CompletePickupInput['partnerDestination'])
        : undefined,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <Link className="text-sm font-bold text-[#087f8c]" to="/driver/pickups">
          Kembali
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{ticket.ticketCode}</h1>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {pickup.data.cached && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Detail ini berasal dari cache offline.
        </div>
      )}
      {(complete.error || start.error) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {(complete.error ?? start.error)?.message}
        </div>
      )}
      {formMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {formMessage}
        </div>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Lokasi Customer</h2>
        <p className="mt-3 text-lg font-semibold">
          {ticket.customerName ?? ticket.customerPhoneNumber}
        </p>
        <p className="mt-1 text-slate-600">
          {ticket.addressText ?? 'Alamat belum tersedia'}
          {ticket.villageId && (
            <span className="mt-1 block text-sm text-slate-500">
              Kelurahan {getVillage(ticket.villageId)?.name}
            </span>
          )}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <a
            className="rounded-xl bg-[#087f8c] px-3 py-3 text-center font-bold text-white"
            href={mapsUrl(ticket)}
            rel="noreferrer"
            target="_blank"
          >
            Buka Maps
          </a>
          <a
            className="rounded-xl border border-[#159fb3] px-3 py-3 text-center font-bold text-[#087f8c]"
            href={`https://wa.me/${ticket.customerPhoneNumber}`}
            rel="noreferrer"
            target="_blank"
          >
            Chat WA
          </a>
          <a
            className="rounded-xl border border-[#159fb3] px-3 py-3 text-center font-bold text-[#087f8c]"
            href={`tel:+${ticket.customerPhoneNumber}`}
          >
            Telepon
          </a>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Informasi Pickup</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <Info label="Volume" value={ticket.volumeLevel} />
          <Info label="Estimasi bak" value={ticket.tricycleLoadEstimate} />
          <Info
            label="Waktu"
            value={
              ticket.scheduledTimeWindow
                ? `${ticket.scheduledTimeWindow.start}-${ticket.scheduledTimeWindow.end}`
                : '-'
            }
          />
          <Info
            label="Catatan operator"
            value={ticket.operatorNotes ?? '-'}
          />
        </dl>
      </section>

      {((intakePhotos.data?.length ?? 0) > 0 || ticket.photoUrls.length > 0) && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">Foto Sampah dari Customer</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {intakePhotos.data?.map((url, index) => (
              <img
                alt={`Foto sampah warga ${index + 1}`}
                className="aspect-square w-full rounded-xl object-cover"
                key={`intake-${index}`}
                loading="lazy"
                src={url}
              />
            ))}
            {ticket.photoUrls.map((url, index) => (
              <a href={url} key={url} rel="noreferrer" target="_blank">
                <img
                  alt={`Foto sampah customer ${index + 1}`}
                  className="aspect-square w-full rounded-xl object-cover"
                  loading="lazy"
                  src={url}
                />
              </a>
            ))}
          </div>
        </section>
      )}
      {intakePhotos.isError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Foto sampah warga belum dapat dimuat. Lanjutkan dengan alamat dan
          catatan operator.
        </div>
      )}

      {ticket.status === 'ASSIGNED' && (
        <button
          className="w-full rounded-2xl bg-[#087f8c] px-5 py-4 text-lg font-bold text-white disabled:opacity-50"
          disabled={start.isPending}
          onClick={() => setConfirmStart(true)}
          type="button"
        >
          Mulai Penjemputan
        </button>
      )}

      {active && (
        <form
          className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"
          onSubmit={submit}
        >
          <h2 className="text-lg font-bold">Bukti dan Hasil Pickup</h2>
          {!proofStorageEnabled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Upload bukti belum tersedia karena media penyimpanan belum
              dikonfigurasi.
            </div>
          )}
          {proofStorageEnabled && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              Foto akan dikompresi dan disimpan privat di Firestore. Maksimal
              dua foto untuk setiap bagian.
            </div>
          )}
          <PhotoInput
            disabled={!proofStorageEnabled}
            label="Foto sebelum diangkut"
            onInvalid={(description) =>
              setNotice({ title: 'Foto belum dapat digunakan', description })
            }
            onFiles={setBeforeFiles}
          />
          <PhotoInput
            disabled={!proofStorageEnabled}
            label="Foto setelah diangkut"
            onInvalid={(description) =>
              setNotice({ title: 'Foto belum dapat digunakan', description })
            }
            onFiles={setAfterFiles}
          />
          <label className="block text-sm font-bold">
            Hasil aktual
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-base"
              name="result"
              required
            >
              {ACTUAL_TRIP_RESULTS.map((result) => (
                <option key={result} value={result}>
                  {resultLabels[result]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Catatan lapangan
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3 text-base"
              name="notes"
              placeholder="Wajib untuk semua hasil selain selesai satu trip"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold">
              Berat akhir/estimasi lapangan (kg)
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-base"
                min="0"
                name="finalWeightKg"
                placeholder="Opsional"
                step="0.1"
                type="number"
              />
            </label>
            <label className="block text-sm font-bold">
              Tujuan sampah
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-base"
                name="partnerDestination"
              >
                <option value="">Belum dicatat</option>
                {PARTNER_DESTINATIONS.map((destination) => (
                  <option key={destination} value={destination}>
                    {PARTNER_DESTINATION_LABELS[destination]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="w-full rounded-xl bg-[#087f8c] px-4 py-4 text-lg font-bold text-white disabled:opacity-50"
            disabled={complete.isPending || !proofStorageEnabled}
            type="submit"
          >
            {complete.isPending ? 'Menyimpan...' : 'Simpan Hasil Pickup'}
          </button>
        </form>
      )}
      <AppDialog
        busy={start.isPending}
        cancelLabel="Batal"
        confirmLabel="Mulai sekarang"
        description="Status permintaan akan berubah menjadi sedang dijemput. Pastikan Anda sudah menuju atau berada di lokasi warga."
        icon="truck"
        onCancel={() => setConfirmStart(false)}
        onConfirm={() =>
          start.mutate(undefined, {
            onSettled: () => setConfirmStart(false),
          })
        }
        open={confirmStart}
        title="Mulai penjemputan?"
      />
      <AppDialog
        confirmLabel="Mengerti"
        description={notice?.description ?? ''}
        icon="warning"
        onConfirm={() => setNotice(undefined)}
        open={Boolean(notice)}
        title={notice?.title ?? ''}
        tone="warning"
      />
    </div>
  );
}

function PhotoInput({
  label,
  onFiles,
  onInvalid,
  disabled = false,
}: {
  label: string;
  onFiles: (files: File[]) => void;
  onInvalid: (message: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block rounded-xl border border-dashed border-slate-400 bg-slate-50 p-4 text-sm font-bold">
      {label}
      <input
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="mt-3 block w-full text-sm"
        disabled={disabled}
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 2) {
            event.target.value = '';
            onFiles([]);
            onInvalid('Maksimal dua foto untuk setiap bagian.');
            return;
          }
          const invalid = files.find(
            (file) => !file.type.startsWith('image/') || file.size >= 10_485_760,
          );
          if (invalid) {
            event.target.value = '';
            onFiles([]);
            onInvalid(
              'Foto harus JPEG, PNG, atau WebP dan berukuran di bawah 10 MB.',
            );
            return;
          }
          onFiles(files);
        }}
        type="file"
      />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function mapsUrl(ticket: {
  location?: { lat: number; lng: number };
  addressText?: string;
}) {
  const query = ticket.location
    ? `${ticket.location.lat},${ticket.location.lng}`
    : ticket.addressText ?? '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
