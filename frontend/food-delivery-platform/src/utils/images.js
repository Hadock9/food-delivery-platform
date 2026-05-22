import { CategoryMap } from "../constants/category.jsx";

/** Локальні шляхи / assets — не використовуємо (файлів у проєкті немає). */
const LOCAL_IMAGE_PATTERN = /^(\/|\.{1,2}\/|assets\/|src\/|public\/|file:|blob:)/i;

/** Старі URL через Vite-проксі (більше не використовуємо). */
const LEGACY_PROXY_PATTERN = /^\/food-delivery-platform\/images\//i;

const DEFAULT_FOOD_IMAGE =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80";

const DEAD_UNSPLASH_REPLACEMENTS = {
    "photo-1574071318508-1cdbab1a0edd":
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    "photo-1612874741220-86509d82d1e7":
        "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80",
    "photo-1550547660-d9450f1790fd":
        "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&q=80",
    "photo-1573080496219-83f73127ce78":
        "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&q=80",
    "photo-1617196034796-73dfa7b1a2b4":
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
    "photo-1568900112140-7efe1c9c4cb4":
        "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&q=80",
    "photo-1579584425555-c3ce17fd1871":
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
};

const BUSINESS_IMAGES = {
    "11111111-1111-4111-8111-000000000101":
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    "11111111-1111-4111-8111-000000000102":
        "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&q=80",
    "11111111-1111-4111-8111-000000000103":
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
};

const CATEGORY_IMAGES = {
    pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    burger: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&q=80",
    sushi: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
    pasta: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80",
    soup: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
    salad: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80",
    dessert: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    sidedish: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&q=80",
    breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80",
    grill: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80",
    sauce: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    vegan: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    kidsmenu: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80",
    specialoffer: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
};

function extractRawUrl(source) {
    if (!source) return null;
    if (typeof source === "string") return source;
    const candidates = [source.image, source.imageUrl, source.Image, source.ImageUrl];
    for (const candidate of candidates) {
        const normalized = normalizeInternetUrl(candidate);
        if (normalized) return normalized;
    }
    return null;
}

function repairDeadUnsplashUrl(url) {
    for (const [deadId, replacement] of Object.entries(DEAD_UNSPLASH_REPLACEMENTS)) {
        if (url.includes(deadId)) return replacement;
    }
    return url;
}

/** Повний https URL; локальні та legacy-проксі шляхи відкидаємо. */
export function normalizeInternetUrl(url) {
    if (!url || url === "..." || url === "null" || typeof url !== "string") return null;
    let trimmed = url.trim();
    if (!trimmed || LEGACY_PROXY_PATTERN.test(trimmed)) return null;
    trimmed = repairDeadUnsplashUrl(trimmed);
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
        return trimmed;
    }
    if (LOCAL_IMAGE_PATTERN.test(trimmed)) return null;
    return null;
}

function categoryKey(category) {
    if (category == null || category === "") return null;
    if (typeof category === "number") {
        const name = CategoryMap[category];
        if (name) return String(name).replace(/\s+/g, "").toLowerCase();
        return null;
    }
    return String(category).replace(/\s+/g, "").toLowerCase();
}

export function cssBackgroundUrl(url) {
    const safe = normalizeInternetUrl(url);
    if (!safe) return undefined;
    return `url("${safe.replace(/"/g, "\\\"")}")`;
}

function internetFallbackForDish(category, businessId, name) {
    const key = categoryKey(category);
    if (key && CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
    if (businessId && BUSINESS_IMAGES[businessId]) return BUSINESS_IMAGES[businessId];
    const lower = (name || "").toLowerCase();
    if (lower.includes("піц") || lower.includes("pizza") || lower.includes("маргарит"))
        return CATEGORY_IMAGES.pizza;
    if (lower.includes("карбон") || lower.includes("pasta") || lower.includes("паст"))
        return CATEGORY_IMAGES.pasta;
    if (lower.includes("бург") || lower.includes("burger")) return CATEGORY_IMAGES.burger;
    if (lower.includes("суш") || lower.includes("sushi")) return CATEGORY_IMAGES.sushi;
    return DEFAULT_FOOD_IMAGE;
}

function internetFallbackForRestaurant(businessId, name) {
    if (businessId && BUSINESS_IMAGES[businessId]) return BUSINESS_IMAGES[businessId];
    const lower = (name || "").toLowerCase();
    if (lower.includes("pizza") || lower.includes("піц"))
        return BUSINESS_IMAGES["11111111-1111-4111-8111-000000000101"];
    if (lower.includes("burger") || lower.includes("бург"))
        return BUSINESS_IMAGES["11111111-1111-4111-8111-000000000102"];
    if (lower.includes("sushi") || lower.includes("суш"))
        return BUSINESS_IMAGES["11111111-1111-4111-8111-000000000103"];
    return DEFAULT_FOOD_IMAGE;
}

/** Прямий https URL для <img src> (без Vite-проксі). */
export function resolveDishImage(source, category, name, businessId) {
    const fromApi = extractRawUrl(source);
    if (fromApi) return fromApi;
    const id =
        typeof source === "object" && source
            ? source.businessId ?? source.businessDetails?.id
            : businessId;
    return internetFallbackForDish(category, id, name);
}

export function resolveRestaurantImage(source, businessId, name) {
    const fromApi = extractRawUrl(source);
    if (fromApi) return fromApi;
    const id =
        typeof source === "object" && source ? source.id ?? businessId : businessId;
    return internetFallbackForRestaurant(id, name);
}

export function apiImageUrl(source, category, name, businessId) {
    return resolveDishImage(source, category, name, businessId);
}

/** Атрибути для стабільного завантаження зовнішніх CDN. */
export const dishImgProps = {
    loading: "lazy",
    decoding: "async",
    referrerPolicy: "no-referrer",
};

export function handleImageError(event, fallbackUrl) {
    const target = event?.target;
    if (!target) return;

    const primary = normalizeInternetUrl(fallbackUrl) || DEFAULT_FOOD_IMAGE;
    const attempt = Number(target.dataset.imgFallback || "0");

    if (attempt >= 2) return;
    target.dataset.imgFallback = String(attempt + 1);

    const next = attempt === 0 && target.src !== primary ? primary : DEFAULT_FOOD_IMAGE;
    if (target.src !== next) {
        target.src = next;
    }
}
