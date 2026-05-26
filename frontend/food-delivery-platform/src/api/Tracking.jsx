import axios from "axios";

const TRACKING_API_ROOT =
    import.meta.env.VITE_TRACKING_API_URL?.replace(/\/tracking$/i, "") ||
    (import.meta.env.DEV ? "/api" : "http://localhost:5006/api");

const TRACKING_API_BASE =
    import.meta.env.VITE_TRACKING_API_URL ||
    `${TRACKING_API_ROOT}/tracking`;

const trackingApi = axios.create({
    baseURL: TRACKING_API_BASE,
    withCredentials: true,
});

const locationApi = axios.create({
    baseURL: TRACKING_API_ROOT,
    withCredentials: true,
});

trackingApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

locationApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const getOrderTracking = async (orderId) => {
    const res = await trackingApi.get(`/${orderId}`);
    return res.data;
};

export const getLocationById = async (locationId) => {
    const res = await locationApi.get(`/Location/${locationId}`);
    return res.data;
};
