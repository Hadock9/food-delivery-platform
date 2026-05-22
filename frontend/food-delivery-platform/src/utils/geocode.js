const cache = new Map();

/** Nominatim (OpenStreetMap) — без API-ключа, для dev */
export async function geocodeAddress(address) {
  if (!address?.trim()) return null;
  const key = address.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);

  try {
    const q = encodeURIComponent(address.trim());
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
      { headers: { Accept: "application/json", "Accept-Language": "uk" } }
    );
    const data = await res.json();
    if (!data?.[0]) return null;
    const point = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      fullAddress: data[0].display_name,
    };
    cache.set(key, point);
    return point;
  } catch (e) {
    console.warn("geocode failed", e);
    return null;
  }
}

export function googleDirectionsUrl(from, to) {
  if (from?.latitude != null && to?.latitude != null) {
    return `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&travelmode=driving`;
  }
  if (to?.latitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${to.latitude},${to.longitude}&travelmode=driving`;
  }
  return null;
}
