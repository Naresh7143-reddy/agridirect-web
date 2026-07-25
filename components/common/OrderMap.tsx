'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in Next.js
const customIcon = (color: string) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const farmerIcon = customIcon('#F9A825'); // secondary
const buyerIcon = customIcon('#212121'); // ink-1
const agentIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: #2E7D32; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">🚲</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapBounds({ agent, drop, pickup }: { agent?: [number, number], drop?: [number, number], pickup?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [];
    if (agent) points.push(agent);
    if (drop) points.push(drop);
    if (pickup) points.push(pickup);
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, agent, drop, pickup]);
  return null;
}

export default function OrderMap({
  agentLocation, dropLocation, pickupLocation
}: {
  agentLocation?: [number, number];
  dropLocation?: [number, number];
  pickupLocation?: [number, number];
}) {
  const center = agentLocation || dropLocation || pickupLocation || [20.5937, 78.9629]; // Default India

  return (
    <MapContainer center={center as [number, number]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pickupLocation && (
        <Marker position={pickupLocation} icon={farmerIcon}>
          <Popup>Pickup (Farmer)</Popup>
        </Marker>
      )}
      {dropLocation && (
        <Marker position={dropLocation} icon={buyerIcon}>
          <Popup>Drop (You)</Popup>
        </Marker>
      )}
      {agentLocation && (
        <Marker position={agentLocation} icon={agentIcon}>
          <Popup>Delivery Agent</Popup>
        </Marker>
      )}
      <MapBounds agent={agentLocation} drop={dropLocation} pickup={pickupLocation} />
    </MapContainer>
  );
}
