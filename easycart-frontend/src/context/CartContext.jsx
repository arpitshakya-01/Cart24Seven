import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { addCartItem, clearServerCart, getCart, removeCartItem, updateCartItem } from "../services/cartService";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user, role } = useAuth();
    const buyerEmail = role === "BUYER" ? user?.email?.toLowerCase() : null;
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(Boolean(buyerEmail));
    const [cartError, setCartError] = useState("");

    const applyCart = useCallback((cart) => {
        setCartItems(cart?.items || []);
        setCartError("");
    }, []);

    useEffect(() => {
        let active = true;
        if (!buyerEmail) {
            setCartItems([]);
            setLoading(false);
            setCartError("");
            return () => { active = false; };
        }
        setLoading(true);
        getCart().then((cart) => {
            if (active) applyCart(cart);
        }).catch((error) => {
            if (active) setCartError(error.response?.data?.message || "Your cart could not be loaded. Check that the shop server is running, then retry.");
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [buyerEmail, applyCart]);

    const runCartAction = useCallback(async (request) => {
        if (!buyerEmail) {
            setCartError("Sign in with a buyer account to use your shopping cart.");
            return false;
        }
        try {
            applyCart(await request());
            return true;
        } catch (error) {
            setCartError(error.response?.data?.message || "The cart could not be updated. Please try again.");
            return false;
        }
    }, [buyerEmail, applyCart]);

    const addToCart = (product, quantity = 1) => runCartAction(() => addCartItem(product.id ?? product.productId, Math.max(1, Number(quantity) || 1)));
    const removeFromCart = (id) => runCartAction(() => removeCartItem(id));
    const updateQuantity = (id, quantity) => {
        const next = Number(quantity);
        if (next <= 0) return removeFromCart(id);
        return runCartAction(() => updateCartItem(id, next));
    };
    const increaseQuantity = (id) => {
        const item = cartItems.find((entry) => String(entry.id) === String(id));
        if (!item || Number(item.quantity) >= Number(item.stock)) {
            setCartError("You have reached the available stock for this product.");
            return Promise.resolve(false);
        }
        return updateQuantity(id, Number(item.quantity) + 1);
    };
    const decreaseQuantity = (id) => {
        const item = cartItems.find((entry) => String(entry.id) === String(id));
        return item ? updateQuantity(id, Number(item.quantity) - 1) : Promise.resolve(false);
    };
    const clearCart = () => runCartAction(clearServerCart);
    const clearCartError = () => setCartError("");
    const cartCount = useMemo(() => cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0), [cartItems]);
    const cartTotal = useMemo(() => cartItems.reduce((total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0), [cartItems]);

    return <CartContext.Provider value={{
        cartItems, loading, cartError, clearCartError, addToCart, removeFromCart, updateQuantity,
        increaseQuantity, decreaseQuantity, clearCart, cartCount, cartTotal,
    }}>
        {children}
    </CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
