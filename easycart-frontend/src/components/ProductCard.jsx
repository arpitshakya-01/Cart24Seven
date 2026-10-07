import { ArrowUpRight, Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import RatingStars from "./RatingStars";
import ProductMediaSlider from "./ProductMediaSlider";

function ProductCard({ product }) {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const toast = useToast();
    const productName = product.product_name || product.name || "Product";
    const category = typeof product.category === "string" ? product.category : product.category?.categoryName;
    const isSaved = isInWishlist(product.id);
    const media = product.media?.length ? product.media : [{ url: product.image || product.imageUrl || product.image_url, type: "IMAGE" }];
    const discount = Math.min(100, Math.max(0, Number(product.discount || 0)));
    const price = Number(product.price || 0);
    const originalPrice = discount > 0 && discount < 100 ? Number(product.mrp || price / (1 - discount / 100)) : 0;
    const stock = Number(product.stock ?? 0);
    const rating = Math.min(5, Math.max(0, Number(product.rating || 0)));
    const add = async () => {
        const success = await addToCart(product);
        toast(success ? `${productName} added to your cart.` : "Could not add this item to your cart. Please try again.", success ? "success" : "error");
    };
    const save = () => {
        toggleWishlist(product);
        toast(isSaved ? `${productName} removed from your wishlist.` : `${productName} saved to your wishlist.`, "success");
    };

    return <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#e5cd68] hover:shadow-xl">
        <div className="relative">
            <Link to={`/product/${product.id}`} aria-label={`View ${productName}`} className="block p-0"><ProductMediaSlider media={media} name={productName}/></Link>
            <button type="button" onClick={save} aria-label={isSaved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`} aria-pressed={isSaved} className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow-sm transition hover:bg-rose-50 ${isSaved ? "text-rose-600" : "text-slate-500"}`}><Heart size={18} fill={isSaved ? "currentColor" : "none"}/></button>
            {category && <span className="absolute bottom-3 left-3 max-w-[60%] truncate rounded-full bg-[#111111]/90 px-3 py-1 text-xs font-semibold text-white">{category}</span>}{discount > 0 && <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">{discount}% OFF</span>}{stock > 0 && stock <= 5 && <span className="absolute bottom-3 right-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950 shadow-sm">Only {stock} left</span>}
        </div>
        <div className="p-4 sm:p-5">
            <Link to={`/product/${product.id}`} className="block"><h2 className="line-clamp-2 min-h-12 text-lg font-bold leading-6 text-slate-900 transition group-hover:text-[#806100]">{productName}</h2></Link>
            <p className="mt-1 text-sm text-slate-500">{product.brand || "Cart24Seven selection"}</p>
            <div className="mt-3 flex items-center gap-2"><RatingStars rating={rating} size={14}/><span className="text-xs text-slate-500">{product.reviewCount ? `${product.reviewCount} review${product.reviewCount === 1 ? "" : "s"}` : "No reviews"}</span></div>
            <div className="mt-4 flex items-end justify-between gap-2"><div><p className="text-xs font-medium text-slate-500">Price · Inclusive of all taxes</p><div className="flex flex-wrap items-baseline gap-x-2"><p className="text-2xl font-extrabold tracking-tight text-[#6f5500]">₹{price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>{originalPrice > price && <p className="text-sm font-medium text-slate-400 line-through">₹{originalPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>}</div>{discount > 0 && <p className="text-xs font-bold text-emerald-700">You save ₹{(originalPrice - price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>}</div><Link to={`/product/${product.id}`} aria-label={`View details for ${productName}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff7d1] text-[#604900] transition hover:bg-[#FFD21F]"><ArrowUpRight size={18}/></Link></div>
            <button type="button" onClick={add} disabled={stock <= 0} className="mt-4 w-full rounded-xl bg-[#FFD21F] py-3 font-bold text-[#111111] transition hover:bg-[#E8B900] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"><span className="inline-flex items-center justify-center gap-2"><ShoppingCart size={18}/>{stock <= 0 ? "Out of stock" : "Add to Cart"}</span></button>
        </div>
    </article>;
}

export default ProductCard;


