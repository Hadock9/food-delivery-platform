import axios from "axios";

const ORDER_API_BASE =
    import.meta.env.VITE_ORDER_API_URL ||
    (import.meta.env.DEV ? "/api/order" : "http://localhost:5005/api/order");

const orderApi = axios.create({
    baseURL: ORDER_API_BASE,
    withCredentials: true
});

orderApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getAllOrders = async () => {
    const res = await orderApi.get(`/all`);
    return res.data;
};

export const getOrdersByBusiness = async (businessId) => {
    const res = await orderApi.get(`/business`, { params: { businessId } });
    return res.data;
};

export const getOrdersByCourier = async (courierId) => {
    const res = await orderApi.get(`/courier`, { params: { courierId } });
    return res.data;
};

export const changeOrderStatus = async (orderId, status) => {
    const res = await orderApi.patch(`/status`, null, { params: { orderId, status } });
    return res.data;
};

export const getOrderDetails = async (orderId) => {
    const res = await orderApi.get(`/get-order-details/${orderId}`);
    return res.data;
};

export const getCustomerOrders = async (customerId) => {
    const res = await orderApi.get(`/get-customer-orders`, { params: { customerId } });
    return res.data;
};

export const getCustomerOrderHistory = async (customerId) => {
    const res = await orderApi.get(`/get-customer-history`, { params: { customerId } });
    return res.data;
};

export const getCourierOrderHistory = async (customerId) => {
    const res = await orderApi.get(`/get-courier-history`, { params: { customerId } });
    return res.data;
};

export const createOrder = async (order) => {
    const res = await orderApi.post(`/create-order`, order);
    return res.data;
};

export const createOrders = async (orders) => {
    const res = await orderApi.post(`/create-orders`, orders);
    return res.data;
};

export const deliverOrder = async (orderId, courierId) => {
    const res = await orderApi.post(`/courier/deliver`, null, { params: { orderId, courierId } });
    return res.data;
};
