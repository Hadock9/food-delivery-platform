import axios from "axios";

const USER_API_BASE =
    import.meta.env.VITE_USER_API_URL ||
    (import.meta.env.DEV ? "/api" : "http://localhost:5001/api");
const API_URL = `${USER_API_BASE}/account`;

const accountApi = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

accountApi.interceptors.request.use(config => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

export const getAccount = async (userId) => {
    const response = await accountApi.get(`/${userId}`);
    return response.data;
};

/** Нормалізує бізнес-акаунт з API (camelCase / PascalCase). */
export function normalizeBusinessAccount(raw) {
    if (!raw) return null;
    return {
        id: raw.id ?? raw.Id,
        name: raw.name ?? raw.Name ?? "Заклад",
        description: raw.description ?? raw.Description ?? "",
        imageUrl: raw.imageUrl ?? raw.ImageUrl ?? "",
        accountType: raw.accountType ?? raw.AccountType,
        userId: raw.userId ?? raw.UserId,
    };
}

export const getAllBusinessAccounts = async () => {
    const response = await accountApi.get(`/all/business`);
    const data = response.data;
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeBusinessAccount).filter(Boolean);
};

export const getAccounts = async (userId) => {
    const response = await accountApi.get(`/all/${userId}`);
    return response.data;
};

export const createAccount = async (accountType, accountData) => {
    const formData = new FormData();

    for (const key in accountData) {
        if (accountData[key] !== null && accountData[key] !== undefined) {
            formData.append(key, accountData[key]);
        }
    }

    const endpoint = `/${accountType.toLowerCase()}`;
    const response = await accountApi.post(endpoint, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return response.data;
};


export const updateAccount = async (id, accountData) => {
    const response = await accountApi.put(`/${id}`, accountData);
    return response.data;
};

export const deleteAccount = async (id) => {
    await accountApi.delete(`/${id}`);
    return true;
};

export default accountApi;
