import axios from "axios";

const API_BASE =
    import.meta.env.VITE_USER_API_URL ||
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "/api" : "http://localhost:5001/api");

export const getProfileData = async (token) => {
    const response = await axios.get(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const switchAccount = async (accountId, token) => {
    const response = await axios.put(`${API_BASE}/profile/switch/${accountId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateProfile = async (accountType, body, token) => {
    const formData = new FormData();

    for (const key in body) {
        if (body[key] !== undefined && body[key] !== null) {
            formData.append(key, body[key]);
        }
    }

    const response = await axios.put(`${API_BASE}/account/${accountType}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

