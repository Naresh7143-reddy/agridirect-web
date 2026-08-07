/**
 * Dynamic Geocoding Utility using OpenStreetMap Nominatim API.
 * Converts addresses to exact GPS coordinates (lat, lng) and vice-versa dynamically.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Forward geocode address text to exact lat/lng via Nominatim API */
export async function geocodeAddressText(addressStr: string): Promise<LatLng | null> {
  if (!addressStr || !addressStr.trim()) return null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&limit=1`,
      { headers: { 'User-Agent': 'AgriDirect-Web/1.0' } }
    );
    const data = await response.json();
    if (data && data[0] && data[0].lat && data[0].lon) {
      return {
        lat: Number(Number(data[0].lat).toFixed(6)),
        lng: Number(Number(data[0].lon).toFixed(6)),
      };
    }
  } catch (e) {
    console.warn('Geocoding failed for address:', addressStr, e);
  }
  return null;
}

/** Reverse geocode exact GPS coords to detailed street address */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<{ addressStr: string; details: any } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'AgriDirect-Web/1.0' } }
    );
    const data = await response.json();
    const a = data.address || {};
    const road = a.road || a.street || a.neighbourhood || a.suburb || a.residential;
    const area = a.suburb || a.city_district || a.county || a.village || a.town || a.city;
    const addressStr = [a.house_number || a.building, road, area, a.state, a.postcode]
      .filter(Boolean)
      .join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || 'Exact GPS Location';

    return { addressStr, details: a };
  } catch (e) {
    console.warn('Reverse geocoding failed:', e);
  }
  return null;
}
