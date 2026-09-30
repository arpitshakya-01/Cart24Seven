import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingCart, ShieldCheck, Truck, ArrowRight, RefreshCw } from "lucide-react";
import { useCart } from "../context/CartContext";
import { calculateDeliveryCharge } from "../utils/deliveryCharge";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function Cart() {
    const { cartItems, cartCount, loading, cartError, clearCartError, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
    const subtotal = cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const gst = cartItems.reduce((total, item) => {
        const rate = Number(item.gstRate ?? 18);
        return total + Number(item.price || 0) * Number(item.quantity || 0) * rate / (100 + rate);
    }, 0);
    const deliveryCharge = cartItems.length ? calculateDeliveryCharge(subtotal) : 0;
    const totalAmount = subtotal + deliveryCharge;

    return <main className="min-h-[calc(100vh-6rem)] bg-[#f7f6f2] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#927400]">Your Cart24Seven basket</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"><ShoppingCart className="text-[#b18a00]" size={34}/>Shopping Cart</h1></div>
                {cartItems.length > 0 && <p className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">{cartCount} item{cartCount === 1 ? "" : "s"}</p>}
            </div>

            {cartError && <div role="alert" className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800"><p>{cartError}</p><button type="button" onClick={clearCartError} aria-label="Dismiss cart message" className="font-bold">×</button></div>}
            {loading ? <div className="space-y-4" role="status" aria-label="Loading cart">{[1,2,3].map((item)=><div key={item} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[132px_minmax(0,1fr)]"><div className="skeleton-shimmer h-32 rounded-2xl"/><div><div className="skeleton-shimmer mt-2 h-5 w-2/3 rounded"/><div className="skeleton-shimmer mt-4 h-4 w-1/3 rounded"/><div className="skeleton-shimmer mt-5 h-10 w-1/2 rounded-xl"/></div></div>)}</div> : cartItems.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm sm:px-12"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-[#987600]"><ShoppingCart size={38}/></div><h2 className="mt-6 text-2xl font-bold text-slate-900">Your cart is waiting</h2><p className="mt-2 text-slate-600">Add something you love and it will be saved to your account here.</p><Link to="/categories" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#ffd21f] px-6 py-3 font-bold text-slate-950 transition hover:bg-[#e8b900]">Explore products<ArrowRight size={18}/></Link></div>
            ) : <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
                <section className="space-y-4" aria-label="Cart items">
                    {cartItems.map((item) => {
                        const name = item.name || item.productName || "Product";
                        const atLimit = Number(item.quantity) >= Number(item.stock);
                        return <article key={item.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:items-center sm:p-5">
                            <Link to={`/product/${item.id}`} className="flex h-32 items-center justify-center rounded-2xl bg-[#f6f5f1] p-3"><img src={item.image || "https://placehold.co/400x400?text=Cart24Seven"} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "https://placehold.co/400x400?text=Cart24Seven"; }} alt={name} className="h-full w-full object-contain"/></Link>
                            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-[#806100]">{item.category || "Selected for you"}</span>{atLimit && <span className="text-xs font-semibold text-orange-700">Maximum available quantity</span>}</div><Link to={`/product/${item.id}`} className="mt-2 block text-lg font-bold text-slate-900 hover:text-[#806100]">{name}</Link><p className="mt-1 text-sm text-slate-500">{item.brand || "Cart24Seven"}</p><p className="mt-2 text-lg font-extrabold text-[#725800]">{money(item.price)} <span className="text-xs font-medium text-slate-500">each · Incl. of GST</span> {Number(item.mrp) > Number(item.price) && <span className="ml-1 text-sm font-medium text-slate-400 line-through">{money(item.mrp)}</span>}</p>
                                <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-1"><button type="button" aria-label={`Decrease ${name} quantity`} onClick={() => decreaseQuantity(item.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"><Minus size={17}/></button><span className="min-w-6 text-center font-bold text-slate-900">{item.quantity}</span><button type="button" aria-label={`Increase ${name} quantity`} disabled={atLimit} onClick={() => increaseQuantity(item.id)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff5c2] text-slate-900 hover:bg-[#ffe777] disabled:cursor-not-allowed disabled:opacity-40"><Plus size={17}/></button></div>
                            </div>
                            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><p className="text-lg font-extrabold text-slate-900">{money(Number(item.price || 0) * Number(item.quantity || 0))}</p><button type="button" aria-label={`Remove ${name} from cart`} onClick={() => removeFromCart(item.id)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={17}/><span className="sm:hidden">Remove</span></button></div>
                        </article>;
                    })}
                    <Link to="/categories" className="inline-flex items-center gap-2 px-1 py-2 font-semibold text-[#755b00] hover:text-slate-950"><ArrowRight className="rotate-180" size={18}/>Continue shopping</Link>
                </section>
                <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24"><h2 className="text-xl font-extrabold text-slate-900">Order Summary</h2><p className="mt-1 text-sm text-slate-500">Product prices already include applicable GST.</p><div className="mt-6 space-y-4 text-sm"><div className="flex justify-between text-slate-600"><span>Items ({cartCount})</span><span>{money(subtotal)}</span></div><p className="flex justify-between text-xs text-slate-500"><span>Includes GST</span><span>{money(gst)}</span></p><div className="flex justify-between text-slate-600"><span className="inline-flex items-center gap-2"><Truck size={16}/>Delivery</span><span>{deliveryCharge === 0 ? <span className="font-bold text-emerald-700">FREE</span> : money(deliveryCharge)}</span></div><p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">{subtotal >= 499 ? "Your order qualifies for free delivery." : `Add ${money(499 - subtotal)} for free delivery on orders of ₹499 or more.`}</p><hr className="border-slate-200"/><div className="flex justify-between text-lg font-extrabold text-slate-950"><span>Total</span><span>{money(totalAmount)}</span></div><Link to="/checkout" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffd21f] px-5 py-3.5 font-extrabold text-slate-950 transition hover:bg-[#e8b900]">Proceed to checkout<ArrowRight size={18}/></Link><p className="flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck size={15}/>Your cart is saved to your buyer account</p></div></aside>
            </div>}
        </div>
    </main>;
}

export default Cart;
