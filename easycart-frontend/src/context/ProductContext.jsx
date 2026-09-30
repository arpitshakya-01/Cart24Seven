import { createContext, useContext, useEffect, useState } from "react";
import { getAllProducts, addProduct as addService, updateProduct as updateService, deleteProduct as deleteService, getProductForManagement } from "../services/productService";
const ProductContext = createContext();
export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadProducts = async () => {
        try { setProducts(await getAllProducts()); }
        catch (error) { console.error("Failed to load products:", error); }
        finally { setLoading(false); }
    };
    useEffect(() => { loadProducts(); }, []);
    const addProduct = async (data) => { const result = await addService(data); await loadProducts(); return result; };
    const deleteProduct = async (id) => { await deleteService(id); setProducts((prev) => prev.filter((p) => p.id !== id)); };
    const updateProduct = async (id, data) => { const result = await updateService(id, data); await loadProducts(); return result; };
    const getProduct = (id) => getProductForManagement(id);
    return <ProductContext.Provider value={{ products, loading, addProduct, deleteProduct, updateProduct, getProduct, refreshProducts: loadProducts }}>{children}</ProductContext.Provider>;
};
export const useProducts = () => useContext(ProductContext);
