import { DEFAULT_CITY, DEFAULT_COUNTRY } from "../constants/region.js";

const cache = new Map();

const NOMINATIM_BASE =
  import.meta.env.VITE_NOMINATIM_URL ||
  (import.meta.env.DEV ? "/nominatim" : "https://nominatim.openstreetmap.org");

function formatPhotonAddress(props) {
  if (!props) return null;
  const parts = [
    props.name,
    props.street,
    props.housenumber,
    props.city || props.town || props.village,
    props.state,
    props.country,
  ].filter(Boolean);
  return parts.join(", ") || null;
}

async function geocodeNominatim(address) {
  const q = encodeURIComponent(address.trim());
  const res = await fetch(
    `${NOMINATIM_BASE}/search?format=json&limit=1&q=${q}`,
    { headers: { Accept: "application/json", "Accept-Language": "uk" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.[0]) return null;
  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
    fullAddress: data[0].display_name,
  };
}

/** Пошук координат за текстом адреси (Photon → Nominatim) */
export async function geocodeAddress(address) {
  if (!address?.trim()) return null;
  const key = address.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);

  try {
    const point = await geocodeNominatim(address);
    if (point) cache.set(key, point);
    return point;
  } catch (e) {
    console.warn("geocode failed", address, e);
    return null;
  }
}

/** Текст для пошуку закладу на карті */
export function restaurantLocationQuery(name, city = DEFAULT_CITY) {
  if (!name?.trim()) return null;
  return `${name.trim()}, ${city}, ${DEFAULT_COUNTRY}`;
}

/** Зворотне геокодування (підпис біля маркера «Ви») */
export async function reverseGeocode(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  const key = `rev:${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (cache.has(key)) return cache.get(key).fullAddress;

  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { Accept: "application/json", "Accept-Language": "uk" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const label = data?.display_name ?? null;
    if (label) cache.set(key, { fullAddress: label });
    return label;
  } catch (e) {
    console.warn("reverse geocode failed", e);
    return null;
  }
}

/** Заклад: спочатку назва+місто, якщо ні — центр міста */
export async function geocodeRestaurant(name, city = DEFAULT_CITY) {
  const full = restaurantLocationQuery(name, city);
  if (full) {
    const exact = await geocodeAddress(full);
    if (exact) return exact;
  }
  if (city?.trim()) {
    return geocodeAddress(`${city.trim()}, ${DEFAULT_COUNTRY}`);
  }
  return null;
}

export function googleDirectionsUrl(from, to, options = {}) {
  const destText = options.destinationAddress?.trim();
  const originText = options.originAddress?.trim();

  if (from?.latitude != null && to?.latitude != null) {
    return `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&travelmode=driving`;
  }
  if (from?.latitude != null && destText) {
    return `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${encodeURIComponent(destText)}&travelmode=driving`;
  }
  if (originText && to?.latitude != null) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originText)}&destination=${to.latitude},${to.longitude}&travelmode=driving`;
  }
  if (to?.latitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${to.latitude},${to.longitude}&travelmode=driving`;
  }
  if (destText) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destText)}&travelmode=driving`;
  }
  return null;
}
