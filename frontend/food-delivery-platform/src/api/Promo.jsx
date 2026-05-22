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
