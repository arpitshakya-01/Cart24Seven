import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, PlusCircle } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { normalizeProductImageUrl, resolveProductImage } from "../services/resolveProductImage";
import { uploadProductImage, uploadProductMedia } from "../services/productService";
import { calculatePricing } from "../services/pricing";

function AddProduct() {
    const navigate = useNavigate();
    const { addProduct } = useProducts();
    const { role } = useAuth();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [imageStatus, setImageStatus] = useState("empty");
    const [product, setProduct] = useState({ name: "", brand: "", category: "Electronics", price: "", mrp: "", costPrice: "", operatingCost: "0", platformFeePercent: "8", profitMarginPercent: "20", gstRate: "18", hsnCode: "", discount: "0", rating: "", stock: "", description: "", image: "", media: [] });
    const handleChange = (event) => {
        const { name, value } = event.target;
        setProduct((current) => ({ ...current, [name]: value }));
        if (name === "image") {
            setImageStatus(value.trim() ? "loading" : "empty");
            setError("");
        }
    };
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setImageStatus("loading");
        setError("");
        try {
            const image = await uploadProductImage(file);
            setProduct((current) => ({ ...current, image }));
        } catch (uploadError) {
            setError(uploadError.response?.data?.message || uploadError.message || "Image upload failed.");
            setImageStatus("failed");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };
    const handleMediaUpload = async (event) => {
        const files = event.target.files; if (!files?.length) return;
        setUploading(true); setError("");
        try { const uploaded = await uploadProductMedia(files); setProduct((current) => ({ ...current, media: [...(current.media || []), ...uploaded] })); }
        catch (uploadError) { setError(uploadError.response?.data?.message || uploadError.message || "Media upload failed."); }
        finally { setUploading(false); event.target.value = ""; }
    };
    const removeMedia = (index) => setProduct((current) => ({ ...current, media: current.media.filter((_, i) => i !== index) }));
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        let imageUrl;
        try { imageUrl = normalizeProductImageUrl(product.image); }
        catch (imageError) { setError(imageError.message); return; }
        if (imageStatus !== "loaded") {
            setError(imageStatus === "failed" ? "This image link did not load. Use a direct link to an image file and try again." : "Wait for the image preview to finish loading before saving.");
            return;
        }
        const pricing = calculatePricing(product);
        if (pricing.error) { setError(pricing.error); return; }
        setSaving(true);
        try {
            await addProduct({ ...product, image: imageUrl, media: product.media || [], price: pricing.price, mrp: pricing.mrp, basePrice: pricing.taxablePrice, gstRate: Number(product.gstRate), stock: Number(product.stock), rating: product.rating ? Number(product.rating) : null });
            navigate(role === "SELLER" ? "/seller" : "/admin/manage-products");
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || "Product could not be saved. Check the details and try again.");
        } finally { setSaving(false); }
    };
    const pricing = calculatePricing(product);

    return <main className="min-h-screen bg-[#f6f6f4] px-4 py-8 sm:px-6"><div className="mx-auto max-w-4xl rounded-3xl border border-[#eee1a6] bg-white p-6 shadow-xl sm:p-10">
        <div className="mb-8 flex items-center gap-3"><PlusCircle className="shrink-0 text-[#b38a00]" size={38}/><div><h1 className="text-3xl font-bold text-[#111111] sm:text-4xl">Add New Product</h1><p className="text-gray-600">Add a product to your shop inventory.</p></div></div>
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-100 p-3 text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block font-semibold">Product Name *<input name="name" value={product.name} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required/></label>
            <label className="block font-semibold">Brand *<input name="brand" value={product.brand} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required/></label>
            <label className="block font-semibold">Category<select name="category" value={product.category} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]">{["Electronics", "Fashion", "Shoes", "Books", "Grocery", "Accessories"].map((category) => <option key={category}>{category}</option>)}</select></label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className="font-semibold">Product cost *<input type="number" min="0.01" step="0.01" name="costPrice" value={product.costPrice} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required/><span className="mt-1 block text-xs font-normal text-slate-500">Purchase or manufacturing cost per item.</span></label><label className="font-semibold">Operating cost per item<input type="number" min="0" step="0.01" name="operatingCost" value={product.operatingCost} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]"/><span className="mt-1 block text-xs font-normal text-slate-500">Packaging and other per-item costs.</span></label><label className="font-semibold">Marketplace fee (%)<input type="number" min="0" max="50" step="0.1" name="platformFeePercent" value={product.platformFeePercent} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required/></label><label className="font-semibold">Target profit margin (%)<input type="number" min="0" max="90" step="0.1" name="profitMarginPercent" value={product.profitMarginPercent} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required/></label><label className="font-semibold">GST rate by HSN<select name="gstRate" value={product.gstRate} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]">{[0,0.25,1,1.5,3,5,12,18,28,40].map(rate=><option key={rate} value={rate}>{rate}%</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-500">Confirm the current rate for your HSN code before listing.</span></label><label className="font-semibold">HSN code<input name="hsnCode" value={product.hsnCode} onChange={handleChange} placeholder="Enter product HSN" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required={role === "SELLER"}/></label><label className="font-semibold">Discount (%)<input type="number" min="0" max="90" step="1" name="discount" value={product.discount} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]"/><span className="mt-1 block text-xs font-normal text-slate-500">Optional, shown against a calculated MRP.</span></label><label className="font-semibold">Stock *<input type="number" min="0" name="stock" value={product.stock} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required/></label></div>
            <section aria-live="polite" className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-bold text-slate-900">Calculated buyer price (GST included)</h2><p className="mt-1 text-sm text-slate-600">Covers unit and operating costs, marketplace fee, target margin, and GST.</p></div><div className="text-right"><p className="text-2xl font-extrabold text-[#6f5500]">{pricing.error ? "—" : `₹${pricing.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>{pricing.mrp > pricing.price && <p className="text-sm text-slate-500">MRP ₹{pricing.mrp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · {product.discount}% off</p>}</div></div>{pricing.error ? <p className="mt-3 text-sm font-semibold text-rose-700">{pricing.error}</p> : <p className="mt-3 text-sm text-slate-700">Taxable value ₹{pricing.taxablePrice.toFixed(2)} · GST {product.gstRate}% (₹{pricing.includedGst.toFixed(2)}) · Marketplace fee ₹{pricing.platformFee.toFixed(2)} · Estimated profit ₹{pricing.estimatedProfit.toFixed(2)}. <strong>Buyer price includes all taxes.</strong></p>}</section>
            <label className="block font-semibold">Rating (0–5)<input type="number" min="0" max="5" step="0.1" name="rating" value={product.rating} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]"/><span className="mt-1 block text-xs font-normal text-slate-500">Leave blank until customer ratings are available.</span></label>
            <label className="block font-semibold">Product Image URL *<span className="mt-2 flex items-center rounded-xl border border-slate-300"><span className="bg-[#111111] p-3 text-[#FFD21F]"><ImagePlus/></span><input type="text" inputMode="url" name="image" value={product.image} onChange={handleChange} placeholder="https://example.com/product-image.jpg" className="min-w-0 w-full px-4 py-3 outline-none" required/></span></label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#d6a900] hover:bg-amber-50">{uploading ? "Uploading image…" : "Or upload an image"}<input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="sr-only"/></label>
            <p className="-mt-4 text-xs text-slate-500">Paste a direct link to the image itself (for example, ending in .jpg, .png, or .webp). A webpage link may not display as an image.</p>
            <div className="rounded-2xl border border-slate-200 p-4"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-amber-50">Add more images or videos<input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple onChange={handleMediaUpload} disabled={uploading} className="sr-only"/></label><p className="mt-2 text-xs text-slate-500">Upload multiple images and MP4, WebM, or MOV videos. The first image above remains the main listing image.</p>{product.media?.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{product.media.map((item,index)=><div key={`${item.url}-${index}`} className="relative overflow-hidden rounded-xl border bg-slate-50">{item.type === "VIDEO" ? <video src={resolveProductImage(item.url)} controls className="h-28 w-full object-contain"/> : <img src={resolveProductImage(item.url)} alt={`Product media ${index+1}`} className="h-28 w-full object-contain"/>}<button type="button" onClick={()=>removeMedia(index)} className="w-full border-t bg-white py-1 text-xs font-semibold text-rose-700">Remove</button></div>)}</div>}</div>
            {product.image.trim() && <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"><div className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white sm:w-36"><img key={product.image} src={resolveProductImage(product.image)} alt="Product image preview" onLoad={() => setImageStatus("loaded")} onError={() => setImageStatus("failed")} className="h-full w-full object-contain"/></div><p role="status" className={`text-sm font-semibold ${imageStatus === "loaded" ? "text-emerald-700" : imageStatus === "failed" ? "text-rose-700" : "text-slate-600"}`}>{imageStatus === "loaded" ? "Image preview loaded. This image will be used in product listings, cart, and orders." : imageStatus === "failed" ? "Image could not be loaded. Check the URL and make sure it points directly to an image." : "Loading image preview…"}</p></div>}
            <label className="block font-semibold">Description<textarea name="description" rows="4" value={product.description} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]"/></label>
            <div className="flex flex-wrap gap-4"><button disabled={saving || uploading || imageStatus !== "loaded" || Boolean(pricing.error)} className="rounded-xl bg-[#FFD21F] px-7 py-3 font-bold text-[#111111] transition hover:bg-[#E8B900] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Add Product"}</button><button type="button" onClick={() => navigate(role === "SELLER" ? "/seller" : "/admin/manage-products")} className="rounded-xl border border-slate-300 bg-white px-7 py-3 font-semibold text-slate-700 transition hover:border-[#d6a900] hover:bg-amber-50">Cancel</button></div>
        </form>
    </div></main>;
}

export default AddProduct;
