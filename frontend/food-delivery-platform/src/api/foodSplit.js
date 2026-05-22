import axios from "axios";

const BASE = import.meta.env.VITE_FOOD_SPLIT_URL || "/api/food-split";

const client = axios.create({ baseURL: BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function createGroupSession(businessId, expiresInMinutes = 120) {
  const { data } = await client.post("/sessions", { businessId, expiresInMinutes });
  return data;
}

export async function fetchGroupSession(sessionId) {
  const { data } = await client.get(`/sessions/${sessionId}`);
  return data;
}

export async function fetchSplit(sessionId) {
  const { data } = await client.get(`/sessions/${sessionId}/split`);
  return data;
}

export async function authorizeMockPayment(intentId) {
  const { data } = await client.post(`/payments/${intentId}/authorize`);
  return data;
}

export function getSocketUrl() {
  return import.meta.env.VITE_FOOD_SPLIT_SOCKET_URL || "";
}
