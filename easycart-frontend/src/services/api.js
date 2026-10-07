import axios from "axios";

const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const useLocalBackend = import.meta.env.DEV && !configuredApiUrl;
export const API_BASE_URL = configuredApiUrl
    ? (configuredApiUrl.endsWith("/api") ? configuredApiUrl : `${configuredApiUrl}/api`)
    : (useLocalBackend ? "http://localhost:8080/api" : "");
const api = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
    if (!API_BASE_URL) {
        return Promise.reject(new Error("The backend URL is not configured. Set VITE_API_URL in the frontend hosting settings."));
    }
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
