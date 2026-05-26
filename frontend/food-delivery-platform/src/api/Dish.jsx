import axios from "axios";
import {CategoryMap} from "../constants/category.jsx";
import seedCustomerDishes from "../generated/seedCustomerDishes.js";

const API_BASE =
    import.meta.env.VITE_MENU_API_URL ||
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "/api" : "http://localhost:5004/api");

const dishApi = axios.create({
    baseURL: API_BASE,
    withCredentials: true
});

dishApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const FALLBACK_STATUSES = new Set([401, 403, 404]);

function toFiniteNumber(value, fallback = 0) {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : fallback;
}

function normalizeIngredient(raw) {
    if (!raw) return null;
    return {
        id: raw.id ?? raw.Id ?? null,
        name: raw.name ?? raw.Name ?? "",
        weight: toFiniteNumber(raw.weight ?? raw.Weight, 0),
    };
}

function normalizeDish(raw) {
    if (!raw) return null;

    const businessDetails = raw.businessDetails ?? raw.BusinessDetails ?? raw.business ?? null;
    const businessId =
        raw.businessId ??
        raw.BusinessId ??
        businessDetails?.id ??
        businessDetails?.Id ??
        null;

    const businessName =
        businessDetails?.name ??
        businessDetails?.Name ??
        raw.businessName ??
        raw.BusinessName ??
        "Ресторан";

    return {
        id: raw.id ?? raw.Id ?? null,
        menuId: raw.menuId ?? raw.MenuId ?? null,
        name: raw.name ?? raw.Name ?? "Страва",
        description: raw.description ?? raw.Description ?? "",
        imageUrl: raw.imageUrl ?? raw.ImageUrl ?? raw.image ?? raw.Image ?? "",
        price: toFiniteNumber(raw.price ?? raw.Price, 0),
        category: toFiniteNumber(raw.category ?? raw.Category, 0),
        businessId,
        cookingTime: toFiniteNumber(raw.cookingTime ?? raw.CookingTime, 0),
        ingredients: (raw.ingredients ?? raw.Ingredients ?? [])
            .map(normalizeIngredient)
            .filter(Boolean),
        businessDetails: businessId
            ? { id: businessId, name: businessName }
            : null,
    };
}

function loadSeedCustomerDishes() {
    return Array.isArray(seedCustomerDishes)
        ? seedCustomerDishes.map(normalizeDish).filter(Boolean)
        : [];
}

function shouldUseSeedFallback(error) {
    const status = error?.response?.status;
    return !status || FALLBACK_STATUSES.has(status) || status >= 500;
}

function getSeedDishesByBusinessId(businessId) {
    return loadSeedCustomerDishes().filter(
        (item) => String(item.businessId) === String(businessId)
    );
}

// Отримати всі страви для customer
export const getAllDishesForCustomer = async () => {
    try {
        const res = await dishApi.get(`/dish/customer`);
        const dishes = Array.isArray(res.data) ? res.data.map(normalizeDish).filter(Boolean) : [];
        if (dishes.length > 0) return dishes;

        const seeded = loadSeedCustomerDishes();
        return seeded.length > 0 ? seeded : dishes;
    } catch (error) {
        const seeded = loadSeedCustomerDishes();
        if (seeded.length > 0 && shouldUseSeedFallback(error)) {
            return seeded;
        }
        throw error;
    }
};

// Отримати страву для customer по Id
export const getDishForCustomer = async (id) => {
    try {
        const res = await dishApi.get(`/dish/customer/${id}`);
        const dish = normalizeDish(res.data);
        if (dish) return dish;

        return loadSeedCustomerDishes().find((item) => String(item.id) === String(id)) ?? null;
    } catch (error) {
        const fallbackDish = loadSeedCustomerDishes().find((item) => String(item.id) === String(id));
        if (fallbackDish && shouldUseSeedFallback(error)) {
            return fallbackDish;
        }
        if (shouldUseSeedFallback(error)) {
            return null;
        }
        throw error;
    }
};

// Отримати страви для customer по BusinessId
export const getDishesForCustomerByBusinessId = async (businessId) => {
    try {
        const res = await dishApi.get(`/dish/customer/${businessId}/dish`);
        const dishes = Array.isArray(res.data) ? res.data.map(normalizeDish).filter(Boolean) : [];
        if (dishes.length > 0) return dishes;

        return getSeedDishesByBusinessId(businessId);
    } catch (error) {
        const fallbackDishes = getSeedDishesByBusinessId(businessId);
        if (shouldUseSeedFallback(error)) {
            return fallbackDishes;
        }
        throw error;
    }
};

// Отримати всі страви (admin/business)
export const getAllDishes = async () => {
    const response = await dishApi.get(`/dish`);
    return response.data;
};

// Отримати страву по Id
export const getDishById = async (id) => {
    const response = await dishApi.get(`/dish/${id}`);
    return response.data;
};

// Отримати страви по BusinessId
export const getDishesByBusinessId = async (businessId) => {
    const response = await dishApi.get(`/dish/${businessId}/dish`);
    return response.data;
};

// Видалити страву
export const deleteDish = async (id) => {
    const response = await dishApi.delete(`/dish/${id}`);
    return response.data;
};

// Створити страву
export const createDish = async (dish) => {
    const formData = new FormData();

    formData.append("UserId", dish.userId);

    if (dish.menuId) formData.append("MenuId", dish.menuId);

    formData.append("Name", dish.name);
    if (dish.description) formData.append("Description", dish.description);
    formData.append("Price", dish.price);
    formData.append("CookingTime", dish.cookingTime);

    if (dish.category && CategoryMap[dish.category]) {
        formData.append("Category", CategoryMap[dish.category]);
    }

    if (dish.image) {
        formData.append("Image", dish.image);
    }

    if (dish.ingredients?.length > 0) {
        dish.ingredients.forEach((i, idx) => {
            formData.append(`Ingredients[${idx}].Name`, i.name);
            formData.append(`Ingredients[${idx}].Weight`, i.weight);
        });
    }

    const res = await dishApi.post(`/dish/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });

    return res.data;
};

// Оновити страву
export const updateDish = async (id, body) => {
    const formData = new FormData();

    formData.append("DishId", id);
    formData.append("Name", body.name);
    formData.append("Description", body.description ?? "");
    formData.append("Price", body.price);
    formData.append("CookingTime", body.cookingTime);
    const categoryValue =
        typeof body.category === "number"
            ? (CategoryMap[body.category] ?? body.category)
            : body.category;
    formData.append("Category", categoryValue);

    if (body.menuId) formData.append("MenuId", body.menuId);
    if (body.image) formData.append("Image", body.image);

    if (body.ingredients?.length > 0) {
        body.ingredients.forEach((ing, index) => {
            if (ing.id) formData.append(`Ingredients[${index}].Id`, ing.id);
            formData.append(`Ingredients[${index}].Name`, ing.name);
            formData.append(`Ingredients[${index}].Weight`, ing.weight);
        });
    }

    const response = await dishApi.post(`/dish/update`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });

    return response.data;
};


