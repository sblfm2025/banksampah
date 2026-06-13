import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from 'react';
import { NavLink } from 'react-router-dom';
import {
  PICKUP_STATUS_LABELS,
  type PickupStatus,
} from '../../shared/constants/statuses';

export function AppLogo({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <img
        alt="Yayasan Masyarakat Peduli Pinrang"
        className={`${compact ? 'h-10 w-10' : 'h-14 w-14'} rounded-2xl bg-white object-contain p-1 shadow-sm`}
        src="/logo-yayasan-masyarakat-peduli-pinrang.png"
      />
      <div className={compact ? 'hidden sm:block' : ''}>
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.18em] ${inverse ? 'text-cyan-100' : 'text-[#087f8c]'}`}
        >
          Peduli Pinrang
        </p>
        <p
          className={`font-extrabold ${inverse ? 'text-white' : 'text-slate-950'}`}
        >
          Jemput Sampah
        </p>
      </div>
    </div>
  );
}

export function AppHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="app-container flex min-h-20 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {back}
          <AppLogo compact />
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}

const navItems = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/sampahku', label: 'Sampahku', icon: 'leaf' },
  { to: '/tickets', label: 'Tiket', icon: 'ticket' },
  { to: '/profile', label: 'Profil', icon: 'user' },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgb(15_23_42/0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {navItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `flex min-h-18 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                isActive ? 'text-[#087f8c]' : 'text-slate-400'
              }`
            }
            end={item.to === '/'}
            key={item.to}
            to={item.to}
          >
            <AppIcon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function PrimaryButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-2xl bg-[#159fb3] px-5 py-3.5 font-bold text-white shadow-[0_10px_24px_rgb(21_159_179/0.24)] transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function OutlineButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-2xl border border-[#159fb3] bg-white px-5 py-3.5 font-bold text-[#087f8c] transition hover:bg-[#e6f7fa] disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`rounded-[1.5rem] border border-[#d9e2e7] bg-white shadow-[0_10px_35px_rgb(15_23_42/0.06)] ${className}`}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  icon = 'spark',
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  icon?: IconName;
  tone?: 'primary' | 'green' | 'amber';
}) {
  const tones = {
    primary: 'bg-[#e6f7fa] text-[#087f8c]',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <Card className="p-4">
      <span
        className={`grid h-10 w-10 place-items-center rounded-2xl ${tones[tone]}`}
      >
        <AppIcon name={icon} />
      </span>
      <p className="mt-4 text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </Card>
  );
}

const statusStyles: Record<PickupStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700',
  NEEDS_INFO: 'bg-amber-50 text-amber-700',
  NEEDS_OPERATOR_REVIEW: 'bg-orange-50 text-orange-700',
  CONFIRMED: 'bg-cyan-50 text-cyan-700',
  SCHEDULED: 'bg-violet-50 text-violet-700',
  ASSIGNED: 'bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'bg-sky-50 text-sky-700',
  COMPLETED: 'bg-green-50 text-green-700',
  EXTRA_TRIP_REQUIRED: 'bg-red-50 text-red-700',
  REJECTED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

export function StatusBadge({ status }: { status: PickupStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${statusStyles[status]}`}
    >
      {PICKUP_STATUS_LABELS[status]}
    </span>
  );
}

const volumeLabels = {
  SMALL: 'Sampah kecil',
  MEDIUM: 'Sampah sedang',
  LARGE: 'Sampah banyak',
  OVERSIZED: 'Perlu dicek operator',
  UNKNOWN: 'Belum dianalisa',
} as const;

export function VolumeBadge({
  volume,
}: {
  volume: keyof typeof volumeLabels;
}) {
  return (
    <span className="inline-flex rounded-full bg-[#e6f7fa] px-3 py-1 text-[11px] font-bold text-[#087f8c]">
      {volumeLabels[volume]}
    </span>
  );
}

export function DistrictBadge({ district }: { district: string }) {
  return (
    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold text-green-700">
      {district}
    </span>
  );
}

export function ServiceCard({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-5">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e6f7fa] text-[#087f8c]">
        <AppIcon name={icon} />
      </span>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Card>
  );
}

export function TicketCard({
  code,
  status,
  address,
  schedule,
  draft = false,
  children,
}: {
  code: string;
  status: PickupStatus;
  address: string;
  schedule?: string;
  draft?: boolean;
  children?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400">Nomor tiket</p>
          <h3 className="mt-1 font-extrabold">{code}</h3>
        </div>
        {draft ? (
          <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
            Draft lokal
          </span>
        ) : (
          <StatusBadge status={status} />
        )}
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p className="flex gap-2">
          <AppIcon name="pin" /> <span>{address}</span>
        </p>
        {schedule && (
          <p className="flex gap-2">
            <AppIcon name="calendar" /> <span>{schedule}</span>
          </p>
        )}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </Card>
  );
}

export function PhotoUploadCard({
  label,
  preview,
  onChange,
}: {
  label: string;
  preview?: string;
  onChange: (file?: File) => void;
}) {
  return (
    <label className="block cursor-pointer overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#9bd4dc] bg-[#f4fbfc] p-4 text-center">
      {preview ? (
        <img
          alt="Preview foto sampah"
          className="aspect-[4/3] w-full rounded-2xl object-cover"
          src={preview}
        />
      ) : (
        <div className="grid min-h-40 place-items-center">
          <div>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-[#087f8c] shadow-sm">
              <AppIcon name="camera" />
            </span>
            <p className="mt-3 font-bold text-[#087f8c]">{label}</p>
            <p className="mt-1 text-xs text-slate-500">
              Foto yang terang membantu pengecekan volume
            </p>
          </div>
        </div>
      )}
      <input
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0])}
        type="file"
      />
    </label>
  );
}

export function BottomSheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40" onClick={onClose}>
      <div
        className="w-full rounded-t-[2rem] bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-200" />
        <h2 className="text-xl font-extrabold">{title}</h2>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AppDialog
      cancelLabel="Belum"
      confirmLabel="Sudah benar"
      description={description}
      icon="pin"
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={open}
      title={title}
    />
  );
}

export function AppDialog({
  open,
  title,
  description,
  confirmLabel = 'Mengerti',
  cancelLabel,
  tone = 'primary',
  icon = 'spark',
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger' | 'warning' | 'success';
  icon?: IconName;
  busy?: boolean;
  onCancel?: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  const tones = {
    primary: 'bg-[#e6f7fa] text-[#087f8c]',
    danger: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-700',
    success: 'bg-green-50 text-green-700',
  };
  return (
    <div
      aria-labelledby="app-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-5 backdrop-blur-sm"
      role="dialog"
    >
      <Card className="w-full max-w-sm p-6 text-center shadow-2xl">
        <span
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${tones[tone]}`}
        >
          <AppIcon name={icon} />
        </span>
        <h2 className="mt-5 text-xl font-extrabold" id="app-dialog-title">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        <div
          className={`mt-6 grid gap-3 ${cancelLabel ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          {cancelLabel && (
            <OutlineButton disabled={busy} onClick={onCancel}>
              {cancelLabel}
            </OutlineButton>
          )}
          <PrimaryButton disabled={busy} onClick={onConfirm}>
            {busy ? 'Memproses...' : confirmLabel}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  illustration,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  illustration?: {
    src: string;
    alt: string;
  };
}) {
  return (
    <Card className="p-8 text-center">
      {illustration ? (
        <img
          alt={illustration.alt}
          className="mx-auto h-44 w-auto object-contain"
          src={illustration.src}
        />
      ) : (
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e6f7fa] text-[#087f8c]">
          <AppIcon name="leaf" />
        </span>
      )}
      <h2 className="mt-5 text-lg font-extrabold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="grid min-h-40 place-items-center text-sm font-medium text-slate-500">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#bde7ec] border-t-[#159fb3]" />
        <p className="mt-3">{label}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

type IconName =
  | 'home'
  | 'leaf'
  | 'ticket'
  | 'user'
  | 'camera'
  | 'pin'
  | 'calendar'
  | 'spark'
  | 'truck'
  | 'arrow'
  | 'phone'
  | 'chart'
  | 'clock'
  | 'warning'
  | 'check';

export function AppIcon({
  name,
  className = 'h-5 w-5',
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    leaf: <><path d="M20 4c-8 0-14 4-14 11 0 3 2 5 5 5 7 0 9-8 9-16Z" /><path d="M4 21c3-6 7-10 13-13" /></>,
    ticket: <><path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z" /><path d="M12 7v10" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    camera: <><path d="M4 7h3l2-3h6l2 3h3v13H4V7Z" /><circle cx="12" cy="13" r="4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    spark: <><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
    truck: <><path d="M3 6h11v11H3V6Z" /><path d="M14 10h4l3 3v4h-7v-7Z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    phone: <path d="M6 3h4l2 5-3 2a16 16 0 0 0 5 5l2-3 5 2v4c0 2-2 3-4 3C9 20 4 15 3 7c0-2 1-4 3-4Z" />,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    warning: <><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v4M12 17h.01" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  };
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
