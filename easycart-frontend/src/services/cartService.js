import api from "./api";
import { resolveProductImage } from "./resolveProductImage";

const normalizeCart = (cart) => ({
    id: cart?.id,
    items: (cart?.items || []).map((item) => ({
        id: item.productId,
        productId: item.productId,
        name: item.productName,
        productName: item.productName,
        brand: item.brand,
        description: item.description,
        image: resolveProductImage(item.imageUrl),
        price: Number(item.price || 0),
        mrp: Number(item.mrp || item.price || 0),
        rating: item.rating,
        stock: Number(item.stock || 0),
        discount: item.discount,
        gstRate: Number(item.gstRate ?? 18),
        hsnCode: item.hsnCode || "",
        category: item.category,
        quantity: Number(item.quantity || 1),
    })),
});

export const getCart = async () => normalizeCart((await api.get("/cart")).data);
export const addCartItem = async (productId, quantity = 1) => normalizeCart((await api.post("/cart/items", { productId: Number(productId), quantity: Number(quantity) })).data);
export const updateCartItem = async (productId, quantity) => normalizeCart((await api.put(`/cart/items/${productId}`, { quantity: Number(quantity) })).data);
export const removeCartItem = async (productId) => normalizeCart((await api.delete(`/cart/items/${productId}`)).data);
export const clearServerCart = async () => normalizeCart((await api.delete("/cart")).data);
