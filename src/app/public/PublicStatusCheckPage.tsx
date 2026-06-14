import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader, Card, EmptyState } from '../ui/components';
import {
  listPublicTickets,
  normalizeIndonesianPhoneNumber,
  type PublicTicket,
} from './public-data';

export function PublicStatusCheckPage() {
  const [result, setResult] = useState<PublicTicket | null>();
  const whatsappUrl = getWhatsAppUrl();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const code = String(data.get('code')).trim().toUpperCase();
    const phone = normalizeIndonesianPhoneNumber(String(data.get('phone')));
    setResult(
      listPublicTickets().find(
        (ticket) =>
          ticket.code.toUpperCase() === code &&
          ticket.customerPhoneNumber === phone,
      ) ?? null,
    );
  }

  return (
    <>
      <AppHeader
        back={(
          <Link
            aria-label="Kembali ke pusat layanan"
            className="grid min-h-12 min-w-12 place-items-center rounded-full text-xl text-[#087f8c]"
            to="/app"
          >
            &larr;
          </Link>
        )}
        homeTo="/app"
        subtitle="Tanpa login"
        titleAsHeading={false}
        title="Cek Status Permintaan"
        titleLink={false}
      />
      <main className="app-container py-8">
        <div className="mx-auto max-w-xl">
          <Card className="p-5 sm:p-7">
            <h1 className="text-2xl font-extrabold">Masukkan data permintaan</h1>
            <p className="mt-2 text-base leading-7 text-slate-500">
              Gunakan kode permintaan dan nomor WhatsApp yang sama saat
              pengajuan. Status backend lengkap tersedia setelah masuk akun.
            </p>
            <form className="mt-6 grid gap-4" onSubmit={submit}>
              <Field
                label="Kode permintaan atau draft"
                name="code"
                placeholder="Contoh: DRAFT-20260614-001"
              />
              <Field
                inputMode="tel"
                label="Nomor WhatsApp"
                name="phone"
                placeholder="Contoh: 0812 3456 7890"
              />
              <button
                className="min-h-12 rounded-2xl bg-[#087f8c] px-5 py-3 font-bold text-white"
                type="submit"
              >
                Cek Status
              </button>
            </form>
          </Card>

          {result === null && (
            <div className="mt-5">
              <EmptyState
                action={
                  whatsappUrl && (
                    <a
                      className="inline-flex min-h-12 items-center rounded-2xl bg-green-600 px-5 py-3 font-bold text-white"
                      href={whatsappUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Chat WhatsApp Operator
                    </a>
                  )
                }
                description="Periksa kembali kode dan nomor WhatsApp. Permintaan dari perangkat lain perlu dicek setelah login atau melalui operator."
                title="Permintaan belum ditemukan"
              />
            </div>
          )}

          {result && (
            <Card className="mt-5 border-green-200 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                Status ditemukan
              </p>
              <h2 className="mt-2 text-xl font-extrabold">
                {result.deliveryStatus === 'SUBMITTED'
                  ? 'Menunggu verifikasi operator'
                  : 'Draft di perangkat'}
              </h2>
              <dl className="mt-5 space-y-4 text-sm">
                <Detail label="Kode" value={result.code} />
                <Detail label="Nama" value={result.customerName ?? '-'} />
                <Detail label="Alamat" value={result.address} />
              </dl>
              <Link
                className="mt-5 grid min-h-12 place-items-center rounded-2xl bg-[#e6f7fa] px-4 text-center font-bold text-[#087f8c]"
                to={`/tickets/${result.id}`}
              >
                Lihat Detail
              </Link>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="text-base font-bold">
      {label}
      <input
        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-[#159fb3]"
        required
        {...props}
      />
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-0">
      <dt className="text-xs font-semibold text-slate-400">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}

function getWhatsAppUrl() {
  const phone = import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER as
    | string
    | undefined;
  if (!phone) return undefined;
  const message =
    'Halo Peduli Pinrang, saya ingin dibantu mengecek status permintaan jemput sampah.';
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}
