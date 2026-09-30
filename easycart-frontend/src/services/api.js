import axios from "axios";

export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/+$/, "");
const api = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401 && localStorage.getItem("token")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("easycartUser");
        window.dispatchEvent(new Event("easycart:unauthorized"));
    }
    return Promise.reject(error);
});

export default api;
