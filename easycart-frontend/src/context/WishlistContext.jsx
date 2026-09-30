import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);
const storageKey = (email) => email ? `cart24Wishlist:${email.toLowerCase()}` : null;
const readWishlist = (key) => {
    if (!key) return [];
    try {
        const saved = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
};
const sameId = (left, right) => String(left) === String(right);

export function WishlistProvider({ children }) {
    const { user, role } = useAuth();
    const buyerKey = role === "BUYER" ? storageKey(user?.email) : null;
    const [wishlistItems, setWishlistItems] = useState(() => readWishlist(buyerKey));
    const [loadedFor, setLoadedFor] = useState(buyerKey);
    const [storageError, setStorageError] = useState("");

    useEffect(() => {
        setWishlistItems(readWishlist(buyerKey));
        setLoadedFor(buyerKey);
        setStorageError("");
    }, [buyerKey]);

    useEffect(() => {
        if (!buyerKey || loadedFor !== buyerKey) return;
        try {
            localStorage.setItem(buyerKey, JSON.stringify(wishlistItems));
            setStorageError("");
        } catch {
            setStorageError("Your browser could not save wishlist changes. Check available storage and try again.");
        }
    }, [buyerKey, loadedFor, wishlistItems]);

    const addToWishlist = (product) => {
        if (!product?.id) return false;
        if (wishlistItems.some((item) => sameId(item.id, product.id))) return false;
        setWishlistItems((items) => items.some((item) => sameId(item.id, product.id)) ? items : [...items, product]);
        return true;
    };
    const removeFromWishlist = (id) => setWishlistItems((items) => items.filter((item) => !sameId(item.id, id)));
    const toggleWishlist = (product) => {
        if (!product?.id) return;
        if (wishlistItems.some((item) => sameId(item.id, product.id))) removeFromWishlist(product.id);
        else addToWishlist(product);
    };
    const clearWishlist = () => setWishlistItems([]);
    const isInWishlist = (id) => wishlistItems.some((item) => sameId(item.id, id));
    const wishlistCount = useMemo(() => wishlistItems.length, [wishlistItems]);

    return <WishlistContext.Provider value={{
        wishlistItems, wishlistCount, storageError, addToWishlist, removeFromWishlist,
        toggleWishlist, clearWishlist, isInWishlist,
    }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
    return useContext(WishlistContext);
}

export { WishlistContext };
