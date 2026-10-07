import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { normalizeProductImageUrl, resolveProductImage } from "../services/resolveProductImage";
import { uploadProductImage, uploadProductMedia } from "../services/productService";
import { calculatePricing } from "../services/pricing";

const categories = ["Electronics", "Fashion", "Shoes", "Books", "Grocery", "Accessories"];

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getProduct, updateProduct } = useProducts();
    const { role } = useAuth();
    const [product, setProduct] = useState(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageStatus, setImageStatus] = useState("loading");
    const back = role === "SELLER" ? "/seller" : "/admin/manage-products";

    useEffect(() => {
        let active = true;
        setImageStatus("loading");
        getProduct(id).then((data) => { if (active) setProduct(data); })
            .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Product could not be loaded."); });
        return () => { active = false; };
    }, [id]);
    const change = (event) => {
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
        const files=event.target.files; if (!files?.length) return; setUploading(true); setError("");
        try { const uploaded=await uploadProductMedia(files); setProduct((current)=>({...current,media:[...(current.media||[]),...uploaded]})); }
        catch (uploadError) { setError(uploadError.response?.data?.message || uploadError.message || "Media upload failed."); }
        finally { setUploading(false); event.target.value=""; }
    };
    const removeMedia = (index) => setProduct((current)=>({...current,media:current.media.filter((_,i)=>i!==index)}));
    const save = async (event) => {
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
        try { await updateProduct(id, { ...product, image: imageUrl, media: product.media || [], price: pricing.price, mrp: pricing.mrp }); navigate(back); }
        catch (requestError) { setError(requestError.response?.data?.message || requestError.message || "Product could not be updated."); }
        finally { setSaving(false); }
    };
    if (!product) return <main className="min-h-screen bg-[#f6f6f4] p-8">{error || "Loading product…"}</main>;

    const fields = [
        ["name", "Product name", "text", true], ["brand", "Brand", "text", true],
        ["costPrice", "Product cost (₹)", "number", true], ["operatingCost", "Operating cost per item (₹)", "number", false],
        ["platformFeePercent", "Marketplace fee (%)", "number", true], ["profitMarginPercent", "Target profit margin (%)", "number", true],
        ["gstRate", "GST rate by HSN (%)", "select", true], ["hsnCode", "HSN code", "text", role === "SELLER"],
        ["discount", "Discount (%)", "number", false], ["rating", "Rating (0–5)", "number", false],
        ["stock", "Stock", "number", true],
    ];
    const pricing = calculatePricing(product);
    return <main className="min-h-screen bg-[#f6f6f4] px-4 py-8 sm:px-6"><form onSubmit={save} className="mx-auto max-w-4xl space-y-5 rounded-3xl border border-[#eee1a6] bg-white p-6 shadow-lg sm:p-9">
        <button type="button" onClick={() => navigate(back)} className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-[#806100]"><ArrowLeft size={18}/>Back to products</button>
        <header><h1 className="text-3xl font-extrabold text-[#111111]">Edit product details</h1><p className="mt-1 text-slate-600">These listing details appear on the buyer product page.</p></header>
        {error && <p role="alert" className="rounded-xl bg-red-100 p-3 text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">{fields.map(([name, label, type, required]) => <label key={name} className="block font-semibold text-slate-800">{label}{type === "select" ? <><select name={name} value={product[name] ?? 18} onChange={change} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]">{[0,0.25,1,1.5,3,5,12,18,28,40].map(rate=><option key={rate} value={rate}>{rate}%</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-500">Confirm the current rate using the product HSN code.</span></> : <input name={name} type={type} min={name === "stock" || name === "discount" || name === "rating" || name === "costPrice" || name === "operatingCost" ? "0" : undefined} max={name === "discount" ? "90" : name === "rating" ? "5" : name === "platformFeePercent" ? "50" : name === "profitMarginPercent" ? "90" : undefined} step={name === "stock" || name === "discount" ? "1" : type === "number" ? "0.01" : undefined} value={product[name] ?? ""} onChange={change} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required={required}/>}</label>)}</div>
        <section aria-live="polite" className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-bold text-slate-900">Calculated buyer price (GST included)</h2><p className="mt-1 text-sm text-slate-600">Includes taxable value, marketplace fee, target margin, and GST.</p></div><div className="text-right"><p className="text-2xl font-extrabold text-[#6f5500]">{pricing.error ? "—" : `₹${pricing.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>{pricing.mrp > pricing.price && <p className="text-sm text-slate-500">MRP ₹{pricing.mrp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · {product.discount}% off</p>}</div></div>{pricing.error ? <p className="mt-3 text-sm font-semibold text-rose-700">{pricing.error}</p> : <p className="mt-3 text-sm text-slate-700">Taxable value ₹{pricing.taxablePrice.toFixed(2)} · Includes ₹{pricing.includedGst.toFixed(2)} GST · Marketplace fee ₹{pricing.platformFee.toFixed(2)} · Estimated profit ₹{pricing.estimatedProfit.toFixed(2)}.</p>}</section>
        <label className="block font-semibold text-slate-800">Category<select name="category" value={typeof product.category === "string" ? product.category : product.category?.categoryName || "Electronics"} onChange={change} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]">{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="block font-semibold text-slate-800">Product Image URL *<span className="mt-2 flex items-center rounded-xl border border-slate-300"><span className="bg-[#111111] p-3 text-[#FFD21F]"><ImagePlus/></span><input name="image" type="text" inputMode="url" value={product.image ?? ""} onChange={change} placeholder="https://example.com/product-image.jpg" className="min-w-0 w-full px-4 py-3 outline-none" required/></span></label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#d6a900] hover:bg-amber-50">{uploading ? "Uploading image…" : "Or upload an image"}<input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="sr-only"/></label>
        <p className="-mt-4 text-xs text-slate-500">Use a direct image link (such as a .jpg, .png, or .webp), not a webpage that contains an image.</p>
        <div className="rounded-2xl border border-slate-200 p-4"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-amber-50">Add more images or videos<input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple onChange={handleMediaUpload} disabled={uploading} className="sr-only"/></label><p className="mt-2 text-xs text-slate-500">Add multiple images and MP4, WebM, or MOV videos to this listing.</p>{product.media?.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{product.media.map((item,index)=><div key={`${item.url}-${index}`} className="overflow-hidden rounded-xl border bg-slate-50">{item.type === "VIDEO" ? <video src={resolveProductImage(item.url)} controls className="h-28 w-full object-contain"/> : <img src={resolveProductImage(item.url)} alt={`Product media ${index+1}`} className="h-28 w-full object-contain"/>}<button type="button" onClick={()=>removeMedia(index)} className="w-full border-t bg-white py-1 text-xs font-semibold text-rose-700">Remove</button></div>)}</div>}</div>
        {product.image && <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"><div className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white sm:w-36"><img key={product.image} src={resolveProductImage(product.image)} alt="Product image preview" onLoad={() => setImageStatus("loaded")} onError={() => setImageStatus("failed")} className="h-full w-full object-contain"/></div><p role="status" className={`text-sm font-semibold ${imageStatus === "loaded" ? "text-emerald-700" : imageStatus === "failed" ? "text-rose-700" : "text-slate-600"}`}>{imageStatus === "loaded" ? "Image preview loaded." : imageStatus === "failed" ? "Image could not be loaded. Check the link." : "Loading image preview…"}</p></div>}
        <label className="block font-semibold text-slate-800">Product description<textarea name="description" value={product.description || ""} onChange={change} rows="5" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]"/></label>
        <button disabled={saving || uploading || imageStatus !== "loaded" || Boolean(pricing.error)} className="rounded-xl bg-[#FFD21F] px-6 py-3 font-bold text-[#111111] transition hover:bg-[#E8B900] disabled:cursor-not-allowed disabled:opacity-50"><Save className="mr-2 inline" size={18}/>{saving ? "Saving…" : "Save product"}</button>
    </form></main>;
}
