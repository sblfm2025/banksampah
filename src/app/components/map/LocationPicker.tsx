import L from 'leaflet';
import { useEffect, useState } from 'react';
import { GeoJSON, Marker, useMap, useMapEvents } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import {
  loadServiceBoundaries,
  type ServiceBoundaryCollection,
} from '../../../shared/regions/service-area-boundaries';
import { OpenStreetMapView } from './OpenStreetMapView';
import { PINRANG_CENTER } from './map.constants';

export interface MapPoint {
  lat: number;
  lng: number;
}

const pickupIcon = L.divIcon({
  className: '',
  html: '<span class="block h-6 w-6 rounded-full border-4 border-white bg-[#087f8c] shadow-lg"></span>',
  iconAnchor: [12, 12],
  iconSize: [24, 24],
});

export function LocationPicker({
  value,
  onChange,
  readOnly = false,
}: {
  value?: MapPoint;
  onChange: (point: MapPoint) => void;
  readOnly?: boolean;
}) {
  const [boundaries, setBoundaries] = useState<ServiceBoundaryCollection>();
  const center: [number, number] = value
    ? [value.lat, value.lng]
    : PINRANG_CENTER;

  useEffect(() => {
    void loadServiceBoundaries().then(setBoundaries).catch(() => undefined);
  }, []);

  return (
    <OpenStreetMapView center={center} className="h-64" zoom={value ? 17 : 14}>
      {boundaries && (
        <GeoJSON
          data={boundaries as GeoJsonObject}
          style={(feature) => ({
            color:
              feature?.properties?.districtId === 'PALETEANG'
                ? '#7c3aed'
                : '#087f8c',
            fillColor:
              feature?.properties?.districtId === 'PALETEANG'
                ? '#c4b5fd'
                : '#9bd4dc',
            fillOpacity: 0.08,
            weight: 2,
          })}
        />
      )}
      <MapInteraction onChange={onChange} readOnly={readOnly} value={value} />
    </OpenStreetMapView>
  );
}

function MapInteraction({
  value,
  onChange,
  readOnly,
}: {
  value?: MapPoint;
  onChange: (point: MapPoint) => void;
  readOnly: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (value) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 17));
  }, [map, value]);

  useMapEvents({
    click(event) {
      if (!readOnly) {
        onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
      }
    },
  });

  if (!value) return null;
  return (
    <Marker
      draggable={!readOnly}
      eventHandlers={{
        dragend(event) {
          const point = event.target.getLatLng();
          onChange({ lat: point.lat, lng: point.lng });
        },
      }}
      icon={pickupIcon}
      position={[value.lat, value.lng]}
    />
  );
}
