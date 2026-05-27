import axios from "axios";

const PROMO_API_BASE =
    import.meta.env.VITE_PROMO_API_URL ||
    (import.meta.env.DEV ? "/api/promos" : "http://localhost:5007/api/promos");

const promoApi = axios.create({
    baseURL: PROMO_API_BASE,
    withCredentials: true,
});

promoApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const checkPromo = async (code, orderTotal, userId = null) => {
    const res = await promoApi.post("/check", { code, orderTotal, userId });
    return res.data;
};

export const applyPromo = async (code, userId, orderTotal) => {
    const res = await promoApi.post("/apply", { code, userId, orderTotal });
    return res.data;
};

export const getPromos = async () => {
    const res = await promoApi.get("");
    return res.data;
};

export const createPromo = async (payload) => {
    const res = await promoApi.post("", payload);
    return res.data;
};

export const updatePromo = async (promoId, payload) => {
    const res = await promoApi.put(`/${promoId}`, payload);
    return res.data;
};

export const deletePromo = async (promoId) => {
    const res = await promoApi.delete(`/${promoId}`);
    return res.data;
};

export const getPromoAnalytics = async () => {
    const res = await promoApi.get("/analytics");
    return res.data;
};
