import api from "./api";

const clearStoredSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("easycartUser");
};

const validStoredSession = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const payloadPart = token.split(".")[1];
        if (!payloadPart) throw new Error("Invalid token");
        const payload = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")));
        if (!payload.exp || payload.exp * 1000 <= Date.now()) throw new Error("Expired token");
        const user = JSON.parse(localStorage.getItem("user") || localStorage.getItem("easycartUser") || "null");
        if (!user?.email || !user?.role) throw new Error("Invalid saved user");
        return user;
    } catch {
        clearStoredSession();
        return null;
    }
};

export const registerUser = async (userData) => (await api.post("/auth/register", {
    name: userData.name?.trim(),
    email: userData.email?.trim(),
    password: userData.password,
})).data;

export const loginUser = async (loginData) => {
    const data = (await api.post("/auth/login", {
        email: loginData.email?.trim(),
        password: loginData.password,
    })).data;
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    localStorage.setItem("easycartUser", JSON.stringify(data));
    return data;
};

export const logoutUser = () => clearStoredSession();
export const getCurrentUser = () => validStoredSession();
export const isLoggedIn = () => Boolean(validStoredSession());
