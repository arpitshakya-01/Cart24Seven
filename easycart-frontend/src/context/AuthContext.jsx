import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginUser, logoutUser } from "../services/authService";

export const AuthContext = createContext(null);

const normalizeRole = (value) => {
    const role = String(value || "").toUpperCase();
    return role === "USER" ? "BUYER" : role;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => getCurrentUser());

    useEffect(() => {
        const expireSession = () => setUser(null);
        window.addEventListener("easycart:unauthorized", expireSession);
        return () => window.removeEventListener("easycart:unauthorized", expireSession);
    }, []);

    const login = async (credentials) => {
        const result = await loginUser(credentials);
        setUser(result);
        return result;
    };
    const logout = () => { logoutUser(); setUser(null); };
    const updateUser = (changes) => {
        setUser((current) => {
            if (!current) return current;
            const next = { ...current, ...changes };
            localStorage.setItem("user", JSON.stringify(next));
            localStorage.setItem("easycartUser", JSON.stringify(next));
            return next;
        });
    };
    const role = normalizeRole(user?.role);
    return <AuthContext.Provider value={{ user, login, logout, updateUser, role, isLoggedIn: Boolean(user && localStorage.getItem("token")) }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
