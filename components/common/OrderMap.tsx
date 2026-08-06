'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = (color: string, label: string) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: ${color}; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; color: white;">${label}</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const farmerIcon = customIcon('#F97316', '🌾');
const buyerIcon = customIcon('#2563EB', '🏠');
const agentIcon = L.divIcon({
  className: 'custom-leaflet-marker pulse-marker',
  html: `<div style="background-color: #10B981; width: 38px; height: 38px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center; font-size: 19px;">🚲</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

function MapBounds({ agent, drop, pickup }: { agent?: [number, number], drop?: [number, number], pickup?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    // Invalidate size to fix Leaflet layout distortion on load
    const timer = setTimeout(() => map.invalidateSize(), 200);

    const points: [number, number][] = [];
    if (agent) points.push(agent);
    if (pickup) points.push(pickup);
    if (drop) points.push(drop);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
    return () => clearTimeout(timer);
  }, [map, agent, drop, pickup]);
  return null;
}

/** Utility to separate markers if farmer, buyer, and driver have identical/close GPS coords */
function disambiguateCoords(
  agent?: [number, number],
  pickup?: [number, number],
  drop?: [number, number]
) {
  let p = pickup ? [...pickup] as [number, number] : undefined;
  let d = drop ? [...drop] as [number, number] : undefined;
  let a = agent ? [...agent] as [number, number] : undefined;

  // If pickup & drop are identical or extremely close (< 0.0005)
  if (p && d && Math.abs(p[0] - d[0]) < 0.0005 && Math.abs(p[1] - d[1]) < 0.0005) {
    p = [p[0] - 0.003, p[1] - 0.003]; // Farm slightly SW
    d = [d[0] + 0.003, d[1] + 0.003]; // Buyer slightly NE
  }

  // If agent is identical to pickup
  if (a && p && Math.abs(a[0] - p[0]) < 0.0003 && Math.abs(a[1] - p[1]) < 0.0003) {
    a = [a[0] + 0.001, a[1] - 0.001];
  }

  return { agentLoc: a, pickupLoc: p, dropLoc: d };
}

export default function OrderMap({
  agentLocation, dropLocation, pickupLocation, isPickedUp
}: {
  agentLocation?: [number, number];
  dropLocation?: [number, number];
  pickupLocation?: [number, number];
  isPickedUp?: boolean;
}) {
  const { agentLoc, pickupLoc, dropLoc } = disambiguateCoords(agentLocation, pickupLocation, dropLocation);
  const center = agentLoc || pickupLoc || dropLoc || [13.0035, 80.0030]; // Default location

  // Route 1: Delivery Partner -> Farm Pickup (Phase 1)
  const partnerToFarmRoute: [number, number][] = [];
  if (agentLoc) partnerToFarmRoute.push(agentLoc);
  if (pickupLoc) partnerToFarmRoute.push(pickupLoc);

  // Route 2: Farm / Partner -> Buyer Dropoff (Phase 2)
  const farmToBuyerRoute: [number, number][] = [];
  if (isPickedUp && agentLoc) {
    farmToBuyerRoute.push(agentLoc);
  } else if (pickupLoc) {
    farmToBuyerRoute.push(pickupLoc);
  }
  if (dropLoc) farmToBuyerRoute.push(dropLoc);

  return (
    <MapContainer center={center as [number, number]} zoom={14} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pickupLoc && (
        <Marker position={pickupLoc} icon={farmerIcon}>
          <Popup className="custom-popup">
            <div className="font-bold text-sm">🌾 Farm Pickup Location</div>
            <div className="text-xs text-gray-600">Collect fresh produce from farmer here</div>
          </Popup>
        </Marker>
      )}
      {dropLoc && (
        <Marker position={dropLoc} icon={buyerIcon}>
          <Popup className="custom-popup">
            <div className="font-bold text-sm">🏠 Buyer Delivery Location</div>
            <div className="text-xs text-gray-600">Deliver order to buyer address</div>
          </Popup>
        </Marker>
      )}
      {agentLoc && (
        <Marker position={agentLoc} icon={agentIcon}>
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

      <MapBounds agent={agentLoc} drop={dropLoc} pickup={pickupLoc} />
    </MapContainer>
  );
}

