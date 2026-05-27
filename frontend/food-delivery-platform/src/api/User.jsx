import axios from "axios";

const USER_API_BASE =
    import.meta.env.VITE_USER_API_URL ||
    (import.meta.env.DEV ? "/api" : "http://localhost:5001/api");
const API_URL = `${USER_API_BASE}/User`;

// створюємо інстанс із автоматичним додаванням токену
const userApi = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

userApi.interceptors.request.use(config => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

export const getProfile = async () => {
    const response = await userApi.get("/profile");
    return response.data;
};

export const getUser = async (userId) => {
    const response = await userApi.get("/user", { params: { userId } });
    return response.data;
};

export const getUsers = async () => {
    const response = await userApi.get("/users");
    return response.data;
};

export default userApi;
