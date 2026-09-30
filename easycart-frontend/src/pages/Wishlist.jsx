import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, TrendingDown, TrendingUp, ArrowRight, PackageSearch } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductContext";
import { useToast } from "../context/ToastContext";
import RatingStars from "../components/RatingStars";
import { resolveProductImage } from "../services/resolveProductImage";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function Wishlist() {
    const { wishlistItems, removeFromWishlist, clearWishlist, storageError } = useWishlist();
    const { addToCart } = useCart();
    const { products } = useProducts();
    const toast = useToast();

    return <main className="min-h-[calc(100vh-5rem)] bg-[#f7f6f2] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#927400]">Saved for later</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"><Heart className="text-rose-600" size={34} fill="currentColor"/>My Wishlist</h1><p className="mt-2 text-slate-600">Keep the products you love together and come back whenever you’re ready.</p></div>
                {wishlistItems.length > 0 && <button type="button" onClick={clearWishlist} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50"><Trash2 size={17}/>Clear wishlist</button>}
            </header>
            {storageError && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{storageError}</p>}
            {wishlistItems.length === 0 ? <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm sm:px-12"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Heart size={38}/></div><h2 className="mt-6 text-2xl font-bold text-slate-900">Your wishlist is empty</h2><p className="mx-auto mt-2 max-w-md text-slate-600">Tap the heart on any product to save it here. Your list is kept with your buyer account on this browser.</p><Link to="/categories" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#ffd21f] px-6 py-3 font-bold text-slate-950 transition hover:bg-[#e8b900]">Browse products<ArrowRight size={18}/></Link></section> : <>
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500">{wishlistItems.length} saved product{wishlistItems.length === 1 ? "" : "s"}</div>
                <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Wishlist products">
                    {wishlistItems.map((saved) => {
                        const live = products.find((product) => String(product.id) === String(saved.id));
                        const item = live || saved;
                        const oldPrice = Number(saved.price || 0);
                        const price = Number(item.price || 0);
                        const changed = Boolean(live && oldPrice > 0 && price !== oldPrice);
                        const name = item.name || item.productName || "Product";
                        const stock = Number(item.stock ?? 0);
                        const discount = Math.min(100, Math.max(0, Number(item.discount || 0)));
                        const originalPrice = discount > 0 && discount < 100 ? Number(item.mrp || price / (1 - discount / 100)) : 0;
                        return <article key={saved.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                            <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#faf9f4] to-slate-100 p-5"><Link to={`/product/${saved.id}`} className="h-full w-full"><img src={resolveProductImage(item.image || item.imageUrl) || "https://placehold.co/500x500?text=Cart24Seven"} alt={name} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "https://placehold.co/500x500?text=Cart24Seven"; }}/></Link><button type="button" aria-label={`Remove ${name} from wishlist`} onClick={() => { removeFromWishlist(saved.id); toast(`${name} removed from your wishlist.`, "success"); }} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-white text-rose-600 shadow-sm transition hover:bg-rose-50"><Heart size={19} fill="currentColor"/></button>{discount > 0 && <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">{discount}% OFF</span>}{item.category && <span className="absolute bottom-3 left-3 max-w-[70%] truncate rounded-full bg-slate-900/85 px-3 py-1 text-xs font-bold text-white">{typeof item.category === "string" ? item.category : item.category?.categoryName}</span>}</div>
                            <div className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.brand || "Cart24Seven selection"}</p><Link to={`/product/${saved.id}`} className="mt-1 block"><h2 className="line-clamp-2 min-h-12 font-bold leading-6 text-slate-900 hover:text-[#806100]">{name}</h2></Link><div className="mt-2"><RatingStars rating={item.rating} size={13}/></div><div className="mt-3 flex flex-wrap items-baseline gap-2"><p className="text-xl font-extrabold text-[#725800]">{money(price)}</p>{originalPrice > price && <p className="text-sm text-slate-400 line-through">{money(originalPrice)}</p>}{changed && <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">{price < oldPrice ? <TrendingDown size={14} className="text-emerald-700"/> : <TrendingUp size={14} className="text-amber-700"/>}{price < oldPrice ? "Price dropped" : "Price changed"} from {money(oldPrice)}</p>}</div>{stock <= 0 && <p className="mt-2 text-sm font-semibold text-rose-700">Currently out of stock</p>}<div className="mt-4 flex gap-2"><button type="button" disabled={stock <= 0} onClick={async () => { const success = await addToCart(item); toast(success ? `${name} added to your cart.` : "Could not add this item to your cart.", success ? "success" : "error"); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ffd21f] px-3 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-[#e8b900] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"><ShoppingCart size={17}/>Add to cart</button><button type="button" onClick={() => { removeFromWishlist(saved.id); toast(`${name} removed from your wishlist.`, "success"); }} aria-label={`Remove ${name} from wishlist`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={18}/></button></div></div>
                        </article>;
                    })}
                </section>
                <div className="mt-8 text-center"><Link to="/categories" className="inline-flex items-center gap-2 font-bold text-[#725800] hover:text-slate-950">Find more to love<ArrowRight size={17}/></Link></div>
            </>}
            {products.length === 0 && wishlistItems.length > 0 && <p className="sr-only"><PackageSearch/>Product information is loading; saved details are shown meanwhile.</p>}
        </div>
    </main>;
}

export default Wishlist;
