import axios from "axios";

const ADMIN_API_BASE =
    import.meta.env.VITE_ADMIN_API_URL ||
    (import.meta.env.DEV ? "/api/admin" : "http://localhost:5011/api/admin");

const adminApi = axios.create({
    baseURL: ADMIN_API_BASE,
    withCredentials: true,
});

adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

function buildDishFormData(dish = {}) {
    const formData = new FormData();

    if (dish.businessId) formData.append("BusinessId", dish.businessId);
    if (dish.menuId) formData.append("MenuId", dish.menuId);
    if (dish.name != null) formData.append("Name", dish.name);
    if (dish.description != null) formData.append("Description", dish.description);
    if (dish.price != null) formData.append("Price", String(dish.price));
    if (dish.category != null) formData.append("Category", String(dish.category));
    if (dish.cookingTime != null) formData.append("CookingTime", String(dish.cookingTime));
    if (dish.image) formData.append("Image", dish.image);

    if (Array.isArray(dish.ingredients)) {
        dish.ingredients.forEach((ingredient, index) => {
            if (ingredient.id) formData.append(`Ingredients[${index}].Id`, ingredient.id);
            formData.append(`Ingredients[${index}].Name`, ingredient.name ?? "");
            formData.append(`Ingredients[${index}].Weight`, String(ingredient.weight ?? 0));
        });
    }

    return formData;
}

export const getAdminDashboard = async () => {
    const res = await adminApi.get("/dashboard");
    return res.data;
};

export const getAdminUsers = async (params = {}) => {
    const res = await adminApi.get("/users", { params });
    return res.data;
};

export const getAdminUser = async (userId) => {
    const res = await adminApi.get(`/users/${userId}`);
    return res.data;
};

export const updateAdminUser = async (userId, payload) => {
    const res = await adminApi.patch(`/users/${userId}`, payload);
    return res.data;
};

export const getAdminBusinesses = async () => {
    const res = await adminApi.get("/businesses");
    return res.data;
};

export const getAdminOrders = async (params = {}) => {
    const res = await adminApi.get("/orders", { params });
    return res.data;
};

export const updateAdminOrderStatus = async (orderId, status) => {
    const res = await adminApi.patch(`/orders/${orderId}/status`, { status });
    return res.data;
};

export const getAdminCategories = async () => {
    const res = await adminApi.get("/categories");
    return res.data;
};

export const createAdminCategory = async (payload) => {
    const res = await adminApi.post("/categories", payload);
    return res.data;
};

export const updateAdminCategory = async (categoryId, payload) => {
    const res = await adminApi.put(`/categories/${categoryId}`, payload);
    return res.data;
};

export const deleteAdminCategory = async (categoryId) => {
    const res = await adminApi.delete(`/categories/${categoryId}`);
    return res.data;
};

export const getAdminDishes = async (params = {}) => {
    const res = await adminApi.get("/dishes", { params });
    return res.data;
};

export const createAdminDish = async (dish) => {
    const res = await adminApi.post("/dishes", buildDishFormData(dish), {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

export const updateAdminDish = async (dishId, dish) => {
    const res = await adminApi.put(`/dishes/${dishId}`, buildDishFormData(dish), {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

export const deleteAdminDish = async (dishId) => {
    const res = await adminApi.delete(`/dishes/${dishId}`);
    return res.data;
};

export default adminApi;
