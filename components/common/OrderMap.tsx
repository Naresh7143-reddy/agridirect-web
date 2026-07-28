'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = (color: string, label: string) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: white;">${label}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const farmerIcon = customIcon('#F97316', '🌾');
const buyerIcon = customIcon('#2563EB', '🏠');
const agentIcon = L.divIcon({
  className: 'custom-leaflet-marker pulse-marker',
  html: `<div style="background-color: #10B981; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px;">🚲</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
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
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
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
  const center = agentLocation || dropLocation || pickupLocation || [17.3850, 78.4867]; // Default Hyderabad

  const polylinePoints: [number, number][] = [];
  if (pickupLocation) polylinePoints.push(pickupLocation);
  if (agentLocation && !pickupLocation) polylinePoints.push(agentLocation);
  if (dropLocation) polylinePoints.push(dropLocation);

  return (
    <MapContainer center={center as [number, number]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pickupLocation && (
        <Marker position={pickupLocation} icon={farmerIcon}>
          <Popup className="custom-popup">
            <div className="font-bold text-sm">🌾 Farm Pickup</div>
            <div className="text-xs text-gray-600">Collect fresh produce here</div>
          </Popup>
        </Marker>
      )}
      {dropLocation && (
        <Marker position={dropLocation} icon={buyerIcon}>
          <Popup className="custom-popup">
            <div className="font-bold text-sm">🏠 Buyer Dropoff</div>
            <div className="text-xs text-gray-600">Deliver order to buyer</div>
          </Popup>
        </Marker>
      )}
      {agentLocation && (
        <Marker position={agentLocation} icon={agentIcon}>
          <Popup className="custom-popup">
            <div className="font-bold text-sm">🚲 Delivery Partner (You)</div>
            <div className="text-xs text-green-600 font-semibold">Live Location Updating</div>
          </Popup>
        </Marker>
      )}

      {polylinePoints.length > 1 && (
        <Polyline
          positions={polylinePoints}
          pathOptions={{ color: '#2563EB', weight: 4, opacity: 0.7, dashArray: '8, 8' }}
        />
      )}

      <MapBounds agent={agentLocation} drop={dropLocation} pickup={pickupLocation} />
    </MapContainer>
  );
}
