import type { ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { PINRANG_CENTER } from './map.constants';

export function OpenStreetMapView({
  center = PINRANG_CENTER,
  zoom = 14,
  children,
  className = 'h-80',
}: {
  center?: [number, number];
  zoom?: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
      <MapContainer
        center={center}
        className="h-full w-full"
        scrollWheelZoom
        zoom={zoom}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </MapContainer>
    </div>
  );
}
