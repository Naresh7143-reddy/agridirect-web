'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = (color: string, label: string) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: white;">${label}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const farmerIcon = customIcon('#F97316', '🌾');
const buyerIcon = customIcon('#2563EB', '🏠');
const agentIcon = L.divIcon({
  className: 'custom-leaflet-marker pulse-marker',
  html: `<div style="background-color: #10B981; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center; font-size: 18px;">🚲</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function MapBounds({ agent, drop, pickup }: { agent?: [number, number], drop?: [number, number], pickup?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [];
    if (agent) points.push(agent);
    if (pickup) points.push(pickup);
    if (drop) points.push(drop);
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, agent, drop, pickup]);
  return null;
}

export default function OrderMap({
  agentLocation, dropLocation, pickupLocation, isPickedUp
}: {
  agentLocation?: [number, number];
  dropLocation?: [number, number];
  pickupLocation?: [number, number];
  isPickedUp?: boolean;
}) {
  const center = agentLocation || pickupLocation || dropLocation || [13.0035, 80.0030]; // Default location

  // Route 1: Delivery Partner -> Farm Pickup (Phase 1)
  const partnerToFarmRoute: [number, number][] = [];
  if (agentLocation) partnerToFarmRoute.push(agentLocation);
  if (pickupLocation) partnerToFarmRoute.push(pickupLocation);

  // Route 2: Farm / Partner -> Buyer Dropoff (Phase 2)
  const farmToBuyerRoute: [number, number][] = [];
  if (isPickedUp && agentLocation) {
    farmToBuyerRoute.push(agentLocation);
  } else if (pickupLocation) {
    farmToBuyerRoute.push(pickupLocation);
  }
  if (dropLocation) farmToBuyerRoute.push(dropLocation);

  return (
    <MapContainer center={center as [number, number]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pickupLocation && (
        <Marker position={pickupLocation} icon={farmerIcon}>
          <Popup className="custom-popup">
            <div className="font-bold text-sm">🌾 Farm Pickup Location</div>
            <div className="text-xs text-gray-600">Collect fresh produce from farmer here</div>
          </Popup>
        </Marker>
      )}
      {dropLocation && (
        <Marker position={dropLocation} icon={buyerIcon}>
          <Popup className="custom-popup">
            <div className="font-bold text-sm">🏠 Buyer Delivery Location</div>
            <div className="text-xs text-gray-600">Deliver order to buyer address</div>
          </Popup>
        </Marker>
      )}
      {agentLocation && (
        <Marker position={agentLocation} icon={agentIcon}>
          <Popup className="custom-popup">
            <div className="font-bold text-sm">🚲 Delivery Partner (You)</div>
            <div className="text-xs text-emerald-600 font-semibold">Live GPS Location Active</div>
          </Popup>
        </Marker>
      )}

      {/* Phase 1 Route: Delivery Partner -> Farm */}
      {!isPickedUp && partnerToFarmRoute.length > 1 && (
        <Polyline
          positions={partnerToFarmRoute}
          pathOptions={{ color: '#F97316', weight: 5, opacity: 0.8, dashArray: '6, 8' }}
        />
      )}

      {/* Phase 2 Route: Farm / Partner -> Buyer Dropoff */}
      {farmToBuyerRoute.length > 1 && (
        <Polyline
          positions={farmToBuyerRoute}
          pathOptions={{ color: isPickedUp ? '#10B981' : '#2563EB', weight: 5, opacity: isPickedUp ? 0.9 : 0.4, dashArray: isPickedUp ? undefined : '4, 6' }}
        />
      )}

      <MapBounds agent={agentLocation} drop={dropLocation} pickup={pickupLocation} />
    </MapContainer>
  );
}

