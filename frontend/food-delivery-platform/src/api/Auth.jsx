import axios from "axios";

/** Текст помилки з відповіді UserService (400/401). */
export function getAuthErrorMessage(err, fallback = "Не вдалося увійти. Перевірте email і пароль.") {
    const data = err?.response?.data;
    if (!data) return err?.message || fallback;
    if (typeof data === "string") return data;
    if (data.message) return data.message;
    if (data.errors) {
        const first = Object.values(data.errors).flat()[0];
        if (first) return first;
    }
    return fallback;
}

const USER_API_BASE =
    import.meta.env.VITE_USER_API_URL ||
    (import.meta.env.DEV ? "/api" : "http://localhost:5001/api");
const API_URL = `${USER_API_BASE}/Auth`;

const authApi = axios.create({
    baseURL: API_URL,
    withCredentials: true // ✅ дозволяє відправляти HttpOnly refresh cookie
});

authApi.interceptors.request.use(config => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

// 📦 API
export const register = async (userData) => {
    const response = await authApi.post("/register", {
        email: userData.email?.trim(),
        password: userData.password,
        name: userData.name?.trim(),
        surname: userData.surname?.trim()
    });
    saveTokens(response.data);
    return response.data;
};

export const login = async (credentials) => {
    const response = await authApi.post("/login", {
        email: credentials.email?.trim(),
        password: credentials.password
    });
    saveTokens(response.data);
    return response.data;
};

export const refresh = async () => {
    const response = await authApi.post("/refresh", {}, { withCredentials: true });
    saveTokens(response.data);
    return response.data;
};

export const logout = async () => {
    await authApi.post("/revoke", {}, { withCredentials: true });
    clearTokens();
};

function saveTokens(tokens) {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("accessTokenExpiresAt", tokens.accessTokenExpiresAt);
}

function clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("accessTokenExpiresAt");
}

export default authApi;
