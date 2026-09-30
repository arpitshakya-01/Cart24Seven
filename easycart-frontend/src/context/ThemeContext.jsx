import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "cart24seven-theme";

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light"; }
        catch { return "light"; }
    });
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Theme still applies for this visit. */ }
    }, [theme]);
    const value = useMemo(() => ({ theme, toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark") }), [theme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used inside ThemeProvider");
    return context;
}
