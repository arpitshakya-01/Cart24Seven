import api from "./api";
import { normalizeProductImageUrl, resolveProductImage } from "./resolveProductImage";
const asProduct = (p) => ({
    id: p.id, name: p.productName || p.name, brand: p.brand, description: p.description,
    price: p.price, mrp: p.mrp ?? p.price, costPrice: p.costPrice, operatingCost: p.operatingCost ?? 0,
    platformFeePercent: p.platformFeePercent ?? 8, profitMarginPercent: p.profitMarginPercent ?? 20,
    basePrice: p.basePrice, gstRate: p.gstRate ?? 18, hsnCode: p.hsnCode || "",
    hsnVerified: Boolean(p.hsnVerified),
    rating: p.rating, reviewCount: p.reviewCount || 0, stock: p.stock, discount: p.discount,
    media: (p.media || []).map((item) => ({ url: resolveProductImage(item.url), type: item.type || "IMAGE" })),
    category: p.category?.categoryName || p.category || "Electronics",
    image: resolveProductImage(p.imageUrl || p.image),
    sellerEmail: p.sellerEmail,
});
const payload = (p) => ({
    productName: p.productName || p.name, brand: p.brand, description: p.description,
    imageUrl: normalizeProductImageUrl(p.imageUrl || p.image),
    media: [{ url: normalizeProductImageUrl(p.imageUrl || p.image), type: "IMAGE" }, ...(p.media || []).filter((item) => normalizeProductImageUrl(item.url) !== normalizeProductImageUrl(p.imageUrl || p.image)).map((item) => ({ url: normalizeProductImageUrl(item.url), type: item.type || "IMAGE" }))], price: Number(p.price), mrp: Number(p.mrp),
    costPrice: Number(p.costPrice), operatingCost: Number(p.operatingCost || 0),
    platformFeePercent: Number(p.platformFeePercent ?? 8), profitMarginPercent: Number(p.profitMarginPercent ?? 20),
    basePrice: Number(p.basePrice || 0), gstRate: Number(p.gstRate ?? 18), hsnCode: p.hsnCode || "",
    rating: p.rating === "" || p.rating == null ? null : Number(p.rating),
    stock: Number(p.stock), discount: Number(p.discount || 0),
    category: typeof p.category === "object" ? p.category : { categoryName: p.category },
});
export const getAllProducts = async () => (await api.get("/products")).data.map(asProduct);
export const getAllProductsForAdmin = async () => (await api.get("/products/admin/all")).data.map(asProduct);
export const getSellerProducts = async () => (await api.get("/seller/products")).data.map(asProduct);
export const updateHsnVerification = async (id, verified) => (await api.patch(`/products/${id}/hsn-verification`, { verified })).data;
export const getProductById = async (id) => asProduct((await api.get("/products/" + id)).data);
export const getProductForManagement = async (id) => asProduct((await api.get("/products/" + id + "/management")).data);
export const addProduct = async (data) => (await api.post("/products", payload(data))).data;
export const updateProduct = async (id, data) => (await api.put("/products/" + id, payload(data))).data;
export const deleteProduct = async (id) => { await api.delete("/products/" + id); };
export const getProductReviews = async (id) => (await api.get(`/reviews/products/${id}`)).data;
export const submitProductReview = async (id, review) => (await api.post(`/reviews/products/${id}`, review)).data;
export const uploadProductMedia = async (files) => {
    const form = new FormData();
    [...files].forEach((file) => form.append("files", file));
    return (await api.post("/upload/multiple", form)).data;
};
export const uploadProductImage = async (file) => {
    const form = new FormData();
    form.append("image", file);
    return (await api.post("/upload", form)).data.imageUrl;
};
