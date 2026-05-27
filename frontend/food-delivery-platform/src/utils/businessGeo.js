import { geocodeAddress, geocodeRestaurant } from "./geocode.js";
import { DEFAULT_CITY } from "../constants/region.js";

const CACHE_KEY = "df-business-geo-if-v1";

/** Фіксовані координати демо-закладів (Івано-Франківськ) */
const GEO_BY_NAME = {
  "burger hub": {
    latitude: 48.9206024,
    longitude: 24.7085068,
    address: "вул. Незалежності, 5, Івано-Франківськ",
  },
  "pizza palace": {
    latitude: 48.9239214,
    longitude: 24.7102138,
    address: "вул. Галицька, 10, Івано-Франківськ",
  },
  "sushi bar": {
    latitude: 48.9184259,
    longitude: 24.7043572,
    address: "вул. Шевченка, 20, Івано-Франківськ",
  },
  "coffee house": {
    latitude: 48.9199453,
    longitude: 24.7035161,
    address: "вул. Мазепи, 34, Івано-Франківськ",
  },
};

function normalizeName(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}

function readCache() {
  try {
    localStorage.removeItem("df-business-geo-v1");
  } catch {
    /* старий кеш (Київ) */
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota */
  }
}

function seedForName(name) {
  return GEO_BY_NAME[normalizeName(name)] || null;
}

function toGeoPoint(raw, fallbackAddress) {
  if (!raw) return null;
  const lat = Number(raw.latitude ?? raw.lat);
  const lng = Number(raw.longitude ?? raw.lng ?? raw.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return {
    latitude: lat,
    longitude: lng,
    address: raw.address || fallbackAddress || null,
    fullAddress: raw.fullAddress || raw.address || fallbackAddress || "Заклад",
    label: "Заклад",
  };
}

/**
 * Координати закладу: API → кеш → seed за назвою → геокодування.
 */
export async function resolveBusinessGeo(business, city = DEFAULT_CITY) {
  if (!business) return null;

  const id = business.id ?? business.Id;
  const name = business.name ?? business.Name ?? "Заклад";
  const apiLat = business.latitude ?? business.Latitude;
  const apiLng = business.longitude ?? business.Longitude;

  if (apiLat != null && apiLng != null) {
    return toGeoPoint(
      {
        latitude: apiLat,
        longitude: apiLng,
        address: business.address ?? business.Address,
      },
      business.address
    );
  }

  const cache = readCache();
  if (id && cache[id]) {
    return toGeoPoint(cache[id], cache[id].address);
  }

  const seed = seedForName(name);
  if (seed) {
    const point = toGeoPoint(seed, seed.address);
    if (id && point) {
      cache[id] = { ...point, name };
      writeCache(cache);
    }
    return point;
  }

  const address =
    business.address ??
    business.Address ??
    (Array.isArray(business.adresses) ? business.adresses[0] : null) ??
    (Array.isArray(business.addresses) ? business.addresses[0] : null);

  let geocoded = null;
  if (address?.trim()) {
    geocoded = await geocodeAddress(`${address}, ${DEFAULT_CITY}`);
  } else {
    geocoded = await geocodeRestaurant(name, city);
  }

  if (!geocoded) return null;

  const point = {
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
    address: address || geocoded.fullAddress,
    fullAddress: geocoded.fullAddress || address || name,
    label: "Заклад",
  };

  if (id) {
    cache[id] = { ...point, name };
    writeCache(cache);
  }

  return point;
}

/** Пакетне прив’язування всіх закладів до geo (паралельно). */
export async function enrichBusinessesWithGeo(businesses, city = DEFAULT_CITY) {
  const list = Array.isArray(businesses) ? businesses : [];
  const resolved = await Promise.all(
    list.map(async (b) => {
      const geo = await resolveBusinessGeo(b, city);
      return {
        ...b,
        address: b.address ?? geo?.address ?? null,
        latitude: geo?.latitude ?? null,
        longitude: geo?.longitude ?? null,
        geo,
      };
    })
  );
  return resolved;
}

export function mapRestaurantFromBusiness(r) {
  return {
    id: r.id,
    name: r.name,
    image: r.image,
    imageUrl: r.imageUrl,
    description: r.description,
    rating: r.rating ?? 4.8,
    deliveryTime: r.deliveryTime ?? "25–40 хв",
    deliveryPrice: r.deliveryPrice ?? "Безкоштовно",
    category: r.category ?? r.description ?? "Ресторан",
    address: r.address ?? r.geo?.address ?? null,
    latitude: r.latitude ?? r.geo?.latitude ?? null,
    longitude: r.longitude ?? r.geo?.longitude ?? null,
    geo: r.geo ?? null,
  };
}

export function businessDeliverFrom(geoOrRestaurant) {
  if (!geoOrRestaurant) return null;
  if (geoOrRestaurant.geo) return geoOrRestaurant.geo;
  if (geoOrRestaurant.latitude != null) {
    return toGeoPoint(geoOrRestaurant, geoOrRestaurant.address);
  }
  return null;
}
