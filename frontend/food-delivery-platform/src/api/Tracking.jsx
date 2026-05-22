import axios from "axios";

const TRACKING_API_BASE =
    import.meta.env.VITE_TRACKING_API_URL ||
    (import.meta.env.DEV ? "/api/tracking" : "http://localhost:5006/api/tracking");

const trackingApi = axios.create({
    baseURL: TRACKING_API_BASE,
    withCredentials: true,
});

trackingApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const getOrderTracking = async (orderId) => {
    const res = await trackingApi.get(`/${orderId}`);
    return res.data;
};
