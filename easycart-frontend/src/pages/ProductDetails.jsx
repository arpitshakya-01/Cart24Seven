import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Heart, PackageCheck, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { getProductById, getProductReviews } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import ProductSkeletonGrid from "../components/ProductSkeletonGrid";
import RatingStars from "../components/RatingStars";
import ProductMediaSlider from "../components/ProductMediaSlider";

const fallbackImage = "https://placehold.co/900x900?text=Cart24Seven";
const money = (value) => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function ProductDetails() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const toast = useToast();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [error, setError] = useState("");
    const [reviews, setReviews] = useState([]);
    useEffect(() => {
        let active = true;
        setLoading(true); setError(""); setProduct(null); setQuantity(1); setAdded(false);
        getProductById(id).then((data) => {
            if (!active) return;
            setProduct(data);
            getProductReviews(data.id).then((items) => { if (active) setReviews(items); }).catch(() => {});
            let buyerKey = "guest";
            try { buyerKey = JSON.parse(localStorage.getItem("user") || "null")?.email || buyerKey; } catch { /* Keep anonymous history when saved user data is invalid. */ }
            const key = "cart24BrowsingHistory:" + buyerKey;
            try { const old = JSON.parse(localStorage.getItem(key) || "[]"); localStorage.setItem(key, JSON.stringify([data.id, ...old.filter((savedId) => String(savedId) !== String(data.id))].slice(0, 30))); }
            catch { localStorage.setItem(key, JSON.stringify([data.id])); }
        }).catch((requestError) => {
            if (active) setError(requestError.response?.data?.message || "We could not load this product right now.");
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id]);

    const stock = Math.max(0, Number(product?.stock || 0));
    const rating = Number(product?.rating || 0);
    const discount = Math.min(100, Math.max(0, Number(product?.discount || 0)));
    const price = Number(product?.price || 0);
    const originalPrice = useMemo(() => discount > 0 && discount < 100 ? Number(product?.mrp || price / (1 - discount / 100)) : 0, [discount, price, product?.mrp]);
    const category = typeof product?.category === "string" ? product.category : product?.category?.categoryName;
    const available = stock > 0;
    const isSaved = product ? isInWishlist(product.id) : false;
    const addSelectedToCart = async () => {
        const success = await addToCart(product, quantity);
        setAdded(success);
        toast(success ? `${quantity} item${quantity === 1 ? "" : "s"} added to your cart.` : "Could not add this item to your cart. Please try again.", success ? "success" : "error");
    };
    const toggleSaved = () => {
        const wasSaved = isInWishlist(product.id);
        toggleWishlist(product);
        toast(wasSaved ? "Removed from your wishlist." : "Saved to your wishlist.", "success");
    };

    if (loading) return <main className="min-h-screen bg-[#f6f6f4] px-4 py-10 sm:px-6"><div className="mx-auto max-w-5xl"><div className="skeleton-shimmer mb-5 h-5 w-48 rounded"/><div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-8"><div className="skeleton-shimmer aspect-square rounded-2xl"/><div><div className="skeleton-shimmer mt-4 h-5 w-32 rounded"/><div className="skeleton-shimmer mt-6 h-9 w-4/5 rounded"/><div className="skeleton-shimmer mt-3 h-5 w-2/3 rounded"/><div className="skeleton-shimmer mt-8 h-12 w-2/3 rounded-xl"/><div className="skeleton-shimmer mt-8 h-12 w-full rounded-xl"/></div></div><ProductSkeletonGrid count={3} columns="mt-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"/></div></main>;
    if (!product) return <main className="min-h-screen bg-[#f6f6f4] px-4 py-16"><div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><PackageCheck size={44} className="mx-auto text-slate-400"/><h1 className="mt-4 text-2xl font-bold text-slate-900">Product unavailable</h1><p className="mt-2 text-slate-600">{error || "This listing may have been removed."}</p><Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FFD21F] px-5 py-3 font-bold text-[#111111]"><ArrowLeft size={18}/>Back to shopping</Link></div></main>;

    return <main className="min-h-screen bg-[#f6f6f4] px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <div className="mx-auto max-w-screen-xl">
            <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500"><Link to="/" className="hover:text-[#806100]">Home</Link><span>/</span><Link to={category ? `/?category=${encodeURIComponent(category)}` : "/categories"} className="hover:text-[#806100]">{category || "Products"}</Link><span>/</span><span className="max-w-[60vw] truncate font-semibold text-slate-800">{product.name}</span></nav>
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative flex min-h-[330px] items-center justify-center bg-gradient-to-br from-[#faf9f4] to-slate-100 p-7 sm:min-h-[480px] sm:p-12">
                        <ProductMediaSlider media={product.media} image={product.image || fallbackImage} name={product.name} className="aspect-auto min-h-[330px] w-full lg:min-h-[480px]"/>
                        {discount > 0 && <span className="absolute left-5 top-5 rounded-full bg-rose-600 px-4 py-2 text-sm font-extrabold text-white">{discount}% OFF</span>}
                        <button type="button" onClick={toggleSaved} aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={isSaved} className={`absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-rose-50 ${isSaved ? "text-rose-600" : "text-slate-500"}`}><Heart size={20} fill={isSaved ? "currentColor" : "none"}/></button>
                    </div>
                    <div className="flex flex-col p-6 sm:p-9 lg:p-11">
                        <div className="flex flex-wrap items-center gap-2">{category && <Link to={`/?category=${encodeURIComponent(category)}`} className="rounded-full bg-[#fff5c2] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#6f5500]">{category}</Link>}<span className={`rounded-full px-3 py-1 text-xs font-bold ${available ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{available ? "In stock" : "Out of stock"}</span></div>
                        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{product.brand || "Cart24Seven selection"}</p>
                        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-[#111111] sm:text-4xl">{product.name}</h1>
                        {rating > 0 ? <div className="mt-4 flex flex-wrap items-center gap-2"><RatingStars rating={rating} size={18}/><span className="text-sm text-slate-500">{product.reviewCount || 0} customer reviews</span></div> : <p className="mt-4 text-sm text-slate-500">No customer rating yet</p>}
                        <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="text-4xl font-extrabold tracking-tight text-[#6f5500]">{money(price)}</span>{originalPrice > price && <><span className="text-lg text-slate-400 line-through">{money(originalPrice)}</span><span className="text-sm font-bold text-emerald-700">Save {money(originalPrice - price)}</span></>}</div>
                        <p className="mt-2 text-sm text-slate-600">Inclusive of all taxes · Includes {money(price * Number(product.gstRate || 0) / (100 + Number(product.gstRate || 0)))} GST at {Number(product.gstRate || 0)}% per item. Delivery, if applicable, is shown at checkout.</p>
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-[#faf9f4] p-4"><p className="flex items-center gap-2 font-bold text-slate-900">{available ? <Check size={18} className="text-emerald-700"/> : <PackageCheck size={18} className="text-rose-600"/>}{available ? stock <= 5 ? `Only ${stock} left in stock` : `${stock} available` : "Currently unavailable"}</p><p className="mt-1 text-sm text-slate-600">Sold by {product.sellerEmail ? "a marketplace seller" : "Cart24Seven"}</p></div>
                        <div className="mt-6 flex flex-wrap items-end gap-3"><label className="text-sm font-semibold text-slate-700">Quantity<select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} disabled={!available} className="mt-2 block rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]">{Array.from({ length: Math.max(1, Math.min(stock, 10)) }, (_, index) => index + 1).map((amount) => <option key={amount} value={amount}>{amount}</option>)}</select></label><button type="button" onClick={addSelectedToCart} disabled={!available} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#FFD21F] px-5 py-3 font-bold text-[#111111] transition hover:bg-[#E8B900] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"><ShoppingCart size={19}/>{added ? "Added to Cart" : "Add to Cart"}</button></div>
                        {added && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{quantity} item{quantity === 1 ? "" : "s"} added to your cart.</p>}
                        <Link to="/cart" className="mt-3 inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-[#d6a900] hover:bg-amber-50">View cart</Link>
                        <div className="mt-auto grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2"><p className="flex items-center gap-2 text-sm text-slate-600"><Truck size={18} className="shrink-0 text-[#a78000]"/>Delivery details confirmed at checkout</p><p className="flex items-center gap-2 text-sm text-slate-600"><ShieldCheck size={18} className="shrink-0 text-[#a78000]"/>Order status available in My Orders</p></div>
                    </div>
                </div>
            </section>
            <section className="mt-6 grid gap-5 md:grid-cols-[1fr_0.8fr]">
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-extrabold text-[#111111]">About this product</h2><p className="mt-4 whitespace-pre-line leading-7 text-slate-700">{product.description?.trim() || "The seller has not added a detailed description for this product yet."}</p></article>
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-extrabold text-[#111111]">Product information</h2><dl className="mt-4 divide-y divide-slate-100">{[["Brand", product.brand || "Not specified"], ["Category", category || "Not specified"], ["Availability", available ? "In stock" : "Out of stock"], ["Listing ID", product.id], ["HSN", product.hsnCode || "Not provided"], ["GST rate", `${Number(product.gstRate || 0)}% (included in price)`], ["Seller", product.sellerEmail ? "Marketplace seller" : "Cart24Seven"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-800">{value}</dd></div>)}</dl></article>
            </section>
            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-extrabold text-[#111111]">Customer reviews</h2>{reviews.length ? <div className="mt-4 divide-y divide-slate-100">{reviews.map((review)=><article key={review.id} className="py-4 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><RatingStars rating={review.rating} size={15}/><span className="text-sm font-semibold text-slate-800">{review.buyerName || "Verified buyer"}</span></div><span className="text-xs text-slate-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-IN") : ""}</span></div>{review.comment && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{review.comment}</p>}</article>)}</div> : <p className="mt-3 text-sm text-slate-500">No reviews yet. Buyers can review this product after delivery from their order page.</p>}</section>
        </div>
    </main>;
}


