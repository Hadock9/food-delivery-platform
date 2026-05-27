/**
 * Маршрут по дорогах через OSRM (без API-ключа).
 * У dev — проксі Vite /osrm → router.project-osrm.org
 */

const OSRM_BASE =
  import.meta.env.VITE_OSRM_URL ||
  (import.meta.env.DEV ? "/osrm" : "https://router.project-osrm.org");

function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return null;
  if (meters < 1000) return `${Math.round(meters)} м`;
  return `${(meters / 1000).toFixed(1)} км`;
}

function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return null;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `~${mins} хв`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `~${h} год ${m} хв`;
}

/**
 * @param {{ latitude, longitude }} from
 * @param {{ latitude, longitude }} to
 * @returns {Promise<{ positions: [number, number][], distanceM: number, durationS: number } | null>}
 */
export async function fetchDrivingRoute(from, to) {
  if (!from || !to) return null;

  const lat1 = Number(from.latitude);
  const lon1 = Number(from.longitude);
  const lat2 = Number(to.latitude);
  const lon2 = Number(to.longitude);

  if ([lat1, lon1, lat2, lon2].some(Number.isNaN)) return null;

  const coordPath = `${lon1},${lat1};${lon2},${lat2}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coordPath}?overview=full&geometries=geojson&alternatives=false`;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;

    const data = await res.json();
    const route = data?.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (!coords?.length) return null;

    const positions = coords.map(([lng, lat]) => [lat, lng]);

    return {
      positions,
      distanceM: route.distance,
      durationS: route.duration,
      distanceLabel: formatDistance(route.distance),
      durationLabel: formatDuration(route.duration),
    };
  } catch (e) {
    console.warn("OSRM route failed", e);
    return null;
  }
}
