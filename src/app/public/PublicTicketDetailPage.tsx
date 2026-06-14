import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { DISTRICT_LABELS } from '../../shared/constants/districts';
import { PICKUP_STATUS_LABELS } from '../../shared/constants/statuses';
import { SERVICE_TYPE_LABELS } from '../../shared/constants/services';
import type { PickupRequest } from '../../shared/schemas/pickup.schema';
import { useAuth } from '../auth/auth-context';
import {
  AppHeader,
  Card,
  DistrictBadge,
  EmptyState,
  PrimaryButton,
  VolumeBadge,
} from '../ui/components';
import { getVillage } from '../../shared/regions/service-areas';
import {
  getPublicTicket,
  updatePublicTicket,
  type PublicTicket,
} from './public-data';
import {
  loadCustomerTicket,
  submitPublicTicket,
} from './public-ticket.repository';

export function PublicTicketDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { authUid } = useAuth();
  const localTicket = id ? getPublicTicket(id) : undefined;
  const remoteId =
    searchParams.get('remote') === '1' ? id : localTicket?.remoteId;
  const [remoteTicket, setRemoteTicket] = useState<PickupRequest>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');
  const whatsappUrl = localTicket ? getDraftWhatsAppUrl(localTicket) : undefined;

  useEffect(() => {
    if (!remoteId) return;
    let active = true;
    void loadCustomerTicket(remoteId)
      .then((ticket) => {
        if (active) setRemoteTicket(ticket);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, [remoteId]);

  async function retry(ticket: PublicTicket) {
    if (!authUid || !ticket.photo) return;
    setRetrying(true);
    setRetryError('');
    try {
      const response = await fetch(ticket.photo);
      const blob = await response.blob();
      const file = new File([blob], 'foto-sampah.jpg', {
        type: blob.type || 'image/jpeg',
      });
      const submitted = await submitPublicTicket(ticket, authUid, file);
      updatePublicTicket(ticket.id, {
        code: submitted.ticketCode,
        deliveryStatus: 'SUBMITTED',
        remoteId: submitted.id,
        lastSyncError: undefined,
      });
      setRemoteTicket(await loadCustomerTicket(submitted.id));
    } catch {
      setRetryError('Permintaan masih belum dapat dikirim. Coba lagi saat koneksi stabil.');
    } finally {
      setRetrying(false);
    }
  }

  if (remoteId && !remoteTicket && !loadFailed) {
    return <main className="app-container py-10">Memuat status permintaan...</main>;
  }
  if (remoteTicket) return <RemoteDetail ticket={remoteTicket} />;
  if (!localTicket) {
    return (
      <>
        <AppHeader title="Detail Permintaan" />
        <main className="app-container py-7">
          <EmptyState
            description="Permintaan tidak ditemukan atau akun ini tidak memiliki akses."
            title="Permintaan tidak tersedia"
          />
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        back={<Link className="text-xl text-[#087f8c]" to="/tickets">&larr;</Link>}
        subtitle={localTicket.code}
        title="Detail Permintaan"
      />
      <main className="app-container space-y-5 py-7">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Draft tersimpan di perangkat, tetapi belum diterima operator.
          {authUid
            ? ' Coba kirim ulang saat koneksi internet stabil.'
            : ' Kirim melalui WhatsApp atau masuk agar dapat dikirim ke sistem.'}
        </div>
        {retryError && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {retryError}
          </p>
        )}
        <LocalSummary ticket={localTicket} />
        {authUid && localTicket.photo ? (
          <PrimaryButton
            className="w-full"
            disabled={retrying}
            onClick={() => void retry(localTicket)}
          >
            {retrying ? 'Mengirim...' : 'Coba Kirim Lagi'}
          </PrimaryButton>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {whatsappUrl && (
              <a
                className="rounded-2xl bg-green-600 px-5 py-3.5 text-center font-bold text-white"
                href={whatsappUrl}
                rel="noreferrer"
                target="_blank"
              >
                Kirim ke WhatsApp Operator
              </a>
            )}
            <Link
              className="rounded-2xl border border-[#159fb3] bg-white px-5 py-3.5 text-center font-bold text-[#087f8c]"
              to={`/auth?next=${encodeURIComponent(`/tickets/${localTicket.id}`)}`}
            >
              Masuk / Buat Akun untuk Mengirim
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

function getDraftWhatsAppUrl(ticket: PublicTicket) {
  const phone = import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER as
    | string
    | undefined;
  if (!phone) return undefined;
  const message = [
    'Halo Peduli Pinrang, saya ingin mengajukan jemput sampah.',
    `Nama: ${ticket.customerName ?? '-'}`,
    `Nomor WA: ${ticket.customerPhoneNumber ?? '-'}`,
    `Alamat: ${ticket.address}`,
    `Kode draft perangkat: ${ticket.code}`,
    'Mohon operator memverifikasi permintaan ini.',
  ].join('\n');
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

function RemoteDetail({ ticket }: { ticket: PickupRequest }) {
  return (
    <>
      <AppHeader
        back={<Link className="text-xl text-[#087f8c]" to="/tickets">&larr;</Link>}
        subtitle={ticket.ticketCode}
        title="Status Permintaan"
      />
      <main className="app-container space-y-5 py-7">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-900">
          Permintaan sudah diterima sistem. Operator akan memeriksa data dan
          menghubungi Anda melalui WhatsApp.
        </div>
        <Card className="p-6">
          <p className="text-xs font-semibold text-slate-400">Status saat ini</p>
          <h2 className="mt-2 text-xl font-extrabold">
            {PICKUP_STATUS_LABELS[ticket.status]}
          </h2>
          <dl className="mt-5 space-y-4 text-sm">
            <Detail label="Nomor permintaan" value={ticket.ticketCode} />
            <Detail label="Alamat" value={ticket.addressText ?? '-'} />
            <Detail
              label="Kelurahan"
              value={getVillage(ticket.villageId)?.name ?? ticket.village ?? '-'}
            />
            <Detail
              label="Layanan"
              value={SERVICE_TYPE_LABELS[ticket.serviceType]}
            />
            <Detail
              label="Jadwal"
              value={
                ticket.scheduledDate
                  ? `${ticket.scheduledDate}, ${ticket.scheduledTimeWindow?.start ?? ''}-${ticket.scheduledTimeWindow?.end ?? ''}`
                  : 'Menunggu konfirmasi operator'
              }
            />
            <Detail
              label="Petugas"
              value={ticket.assignedDriverName ?? 'Belum ditugaskan'}
            />
          </dl>
        </Card>
      </main>
    </>
  );
}

function LocalSummary({ ticket }: { ticket: PublicTicket }) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap gap-2">
        <DistrictBadge district={DISTRICT_LABELS[ticket.district]} />
        <VolumeBadge volume={ticket.volume} />
      </div>
      {ticket.photo && (
        <img
          alt="Foto sampah"
          className="mt-5 aspect-[4/3] w-full rounded-2xl object-cover"
          src={ticket.photo}
        />
      )}
      <dl className="mt-5 space-y-4 text-sm">
        <Detail label="Nama pengaju" value={ticket.customerName ?? '-'} />
        <Detail label="Alamat" value={ticket.address} />
        <Detail label="Catatan" value={ticket.notes || '-'} />
      </dl>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <dt className="text-xs font-semibold text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
