import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { PICKUP_STATUS_LABELS, type PickupStatus } from '../../../shared/constants/statuses';

const STATUS_COLORS: Record<PickupStatus, string> = {
  NEW: '#94a3b8',
  NEEDS_INFO: '#f59e0b',
  NEEDS_OPERATOR_REVIEW: '#fb923c',
  CONFIRMED: '#0ea5e9',
  SCHEDULED: '#0284c7',
  ASSIGNED: '#159fb3',
  IN_PROGRESS: '#14b8a6',
  COMPLETED: '#16a34a',
  EXTRA_TRIP_REQUIRED: '#8b5cf6',
  REJECTED: '#dc2626',
  CANCELLED: '#64748b',
};

export function PickupMarker({
  position,
  status,
  title,
  description,
}: {
  position: [number, number];
  status: PickupStatus;
  title: string;
  description: string;
}) {
  const color = STATUS_COLORS[status];
  const icon = L.divIcon({
    className: '',
    html: `<span style="background:${color}" class="block h-5 w-5 rounded-full border-[3px] border-white shadow-lg"></span>`,
    iconAnchor: [10, 10],
    iconSize: [20, 20],
  });

  return (
    <Marker icon={icon} position={position}>
      <Popup>
        <strong>{title}</strong>
        <br />
        {PICKUP_STATUS_LABELS[status]}
        <br />
        {description}
      </Popup>
    </Marker>
  );
}
