import { API_BASE_URL } from "./api";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || new URL(API_BASE_URL).origin).replace(/\/+$/, "");

export function normalizeProductImageUrl(value) {
    if (!value || typeof value !== "string") return "";
    const source = value.trim();
    if (!source) return "";
    const remote = source.startsWith("//") ? `https:${source}` : source;
    if (/^https?:\/\//i.test(remote)) {
        const parsed = new URL(remote);
        if (!parsed.hostname) throw new Error("Enter a valid, direct image URL.");
        return parsed.href;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(source)) throw new Error("Use an HTTP or HTTPS image link.");
    const cleanPath = source.replace(/^\/+/, "");
    if (cleanPath.startsWith("uploads/")) return `/${cleanPath}`;
    if (!cleanPath.includes("/") && !cleanPath.includes("\\") && cleanPath !== "." && cleanPath !== "..") return `/uploads/${cleanPath}`;
    throw new Error("Use a direct HTTP/HTTPS image link or an uploaded image path.");
}

export function resolveProductImage(value) {
    if (!value || typeof value !== "string") return "";
    const source = value.trim();
    if (/^(https?:|data:|blob:)/i.test(source)) return source;
    if (source.startsWith("//")) return `${window.location.protocol}${source}`;
    const normalized = normalizeProductImageUrl(source);
    return /^https?:\/\//i.test(normalized) ? normalized : `${BACKEND_URL}${normalized}`;
}
