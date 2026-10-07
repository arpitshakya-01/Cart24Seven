import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, PlusCircle, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { getAllProductsForAdmin, getSellerProducts, updateHsnVerification } from "../services/productService";

function ManageProducts() {
    const { deleteProduct } = useProducts();
    const { role, user } = useAuth();
    const seller = role === "SELLER", admin = role === "ADMIN", base = seller ? "/seller" : "/admin";
    const [products, setProducts] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const refresh = async () => {
        setLoading(true); setError("");
        try { setProducts(admin ? await getAllProductsForAdmin() : await getSellerProducts()); }
        catch (e) { setError(e.response?.data?.message || "Products could not be loaded."); }
        finally { setLoading(false); }
    };
    useEffect(() => { refresh(); }, [role]);
    const remove = async (id) => { if (!window.confirm("Delete this product?")) return; try { await deleteProduct(id); await refresh(); } catch { window.alert("Product could not be deleted."); } };
    const verify = async (product) => { try { await updateHsnVerification(product.id, !product.hsnVerified); await refresh(); } catch (e) { setError(e.response?.data?.message || "HSN status could not be updated."); } };
    const visible = seller ? products.filter(p => p.sellerEmail?.toLowerCase() === user?.email?.toLowerCase()) : products;
    return <main className="min-h-screen bg-[#f6f6f4] px-5 py-8"><div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><Package className="text-[#111111]" size={38}/><div><h1 className="text-3xl font-bold text-[#111111]">{seller ? "My Products" : "Manage Products"}</h1><p className="text-gray-600">View listing prices and review GST / HSN compliance.</p></div></div><Link to={base + "/add-product"} className="rounded-xl bg-[#FFD21F] px-5 py-3 font-bold text-[#111111] shadow-sm transition hover:bg-[#E8B900]"><PlusCircle className="mr-1 inline" size={19}/>Add Product</Link></div>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-100 p-3 text-red-800">{error}</p>}
        {admin && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Marketplace seller products remain hidden from buyers until the seller GSTIN and product HSN code are manually verified here.</p>}
        {loading ? <div className="rounded-2xl bg-white p-8 text-slate-500">Loading products…</div> : !visible.length ? <div className="rounded-3xl bg-white p-10 text-center shadow"><p className="text-xl font-bold text-gray-600">No products available.</p></div> : <div className="overflow-x-auto rounded-2xl bg-white shadow"><table className="w-full min-w-[1050px] text-left"><thead className="bg-[#111111] text-[#FFD21F]"><tr>{["Product", "Brand", "Buyer price", "Base price", "GST / HSN", "Stock", "Media / reviews", "Seller", "Actions"].map(x => <th key={x} className="p-4">{x}</th>)}</tr></thead><tbody>{visible.map(p => <tr key={p.id} className="border-b border-slate-200 transition hover:bg-amber-50/70"><td className="p-4">{p.name}</td><td className="p-4">{p.brand}</td><td className="p-4">₹{Number(p.price || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}<small className="block text-xs text-slate-500">Inclusive of tax</small>{Number(p.mrp) > Number(p.price) && <span className="text-sm text-slate-400 line-through">₹{Number(p.mrp).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>}</td><td className="p-4">₹{Number(p.basePrice || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td><td className="p-4"><div>{Number(p.gstRate || 0)}% GST · {p.hsnCode || "No HSN"}</div><span className={`text-xs font-bold ${p.hsnVerified ? "text-emerald-700" : "text-amber-700"}`}>{p.hsnVerified ? "HSN verified" : "HSN pending"}</span></td><td className="p-4">{p.stock ?? 0}</td><td className="p-4 text-sm">{(p.media || []).length} files<br/><span className="text-slate-500">{Number(p.rating || 0).toFixed(1)} ★ · {p.reviewCount || 0} reviews</span></td><td className="p-4">{p.sellerEmail || "Admin / legacy"}</td><td className="p-4"><div className="flex items-center gap-2"><Link to={base + "/edit-product/" + p.id} aria-label="Edit product" className="rounded-lg bg-[#FFD21F] p-2 text-[#111111] transition hover:bg-[#E8B900]"><Pencil size={18}/></Link>{admin && p.sellerEmail && <button type="button" onClick={() => verify(p)} title={p.hsnVerified ? "Revoke HSN verification" : "Verify HSN code"} className={`rounded-lg p-2 text-white ${p.hsnVerified ? "bg-emerald-700" : "bg-indigo-600"}`}><ShieldCheck size={18}/></button>}<button onClick={() => remove(p.id)} aria-label="Delete product" className="rounded-lg bg-red-600 p-2 text-white"><Trash2 size={18}/></button></div></td></tr>)}</tbody></table></div>}
    </div></main>;
}
export default ManageProducts;
