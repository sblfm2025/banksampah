import {
  PICKUP_STATUS_LABELS,
  type PickupStatus,
} from '../../shared/constants/statuses';

const styles: Record<PickupStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  NEEDS_INFO: 'bg-amber-100 text-amber-800',
  NEEDS_OPERATOR_REVIEW: 'bg-orange-100 text-orange-800',
  CONFIRMED: 'bg-teal-100 text-teal-800',
  SCHEDULED: 'bg-violet-100 text-violet-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-cyan-100 text-cyan-800',
  COMPLETED: 'bg-green-100 text-green-800',
  EXTRA_TRIP_REQUIRED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-slate-200 text-slate-700',
};

export function StatusBadge({ status }: { status: PickupStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}
    >
      {PICKUP_STATUS_LABELS[status]}
    </span>
  );
}
