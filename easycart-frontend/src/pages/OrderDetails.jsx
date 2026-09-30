import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft, Check, ChevronDown, ChevronUp, Download, MapPin, MessageCircle,
    Package, Phone, RotateCcw, ShieldCheck, Star
} from "lucide-react";
import { getMyOrders } from "../services/orderService";
import { resolveProductImage } from "../services/resolveProductImage";
import fallbackImage from "../assets/lenovo-loq-rtx5050.png";
import { useToast } from "../context/ToastContext";

const stages = ["Placed", "Processing", "Shipped", "Delivered"];
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const paymentLabel = (method) => method?.startsWith("DEMO_")
    ? `Demo · ${method.slice(5).replaceAll("_", " ")}`
    : method || "Legacy order";
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

function OrderDetails() {
    const { id } = useParams();
    const toast = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showUpdates, setShowUpdates] = useState(true);
    const [showDelivery, setShowDelivery] = useState(true);
    const [showPrice, setShowPrice] = useState(true);
    const storageKey = `easycart-order-rating-${id}`;
    const [rating, setRating] = useState(() => Number(localStorage.getItem(storageKey) || 0));
    const [feedback, setFeedback] = useState(() => localStorage.getItem(`${storageKey}-delivery`) || "");

    useEffect(() => {
        let active = true;
        getMyOrders()
            .then((items) => {
                if (active) {
                    const found = items.find((item) => String(item.id) === String(id));
                    if (found) setOrder(found);
                    else setError("This order could not be found in your account.");
                }
            })
            .catch((e) => { if (active) setError(e.response?.data?.message || "Order details could not be loaded."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id]);

    const amounts = useMemo(() => {
        if (!order) return { subtotal: 0, gst: 0, delivery: 0, total: 0 };
        const storedGross = Number(order.subtotal ?? Number(order.productPrice || 0) * Number(order.quantity || 1));
        const tax = Number(order.gst || 0);
        return {
            subtotal: order.taxableValue == null ? storedGross + tax : storedGross,
            taxable: order.taxableValue == null ? storedGross : Number(order.taxableValue),
            gst: tax,
            delivery: Number(order.deliveryCharge || 0),
            total: Number(order.totalAmount || 0),
        };
    }, [order]);

    const downloadInvoice = () => {
        if (!order) return;
        const address = [order.address, order.city, order.state, order.pincode].filter(Boolean).join(", ");
        const taxBreakdown = Number(order.igst || 0) > 0
            ? `<div class="row"><span>IGST (${escapeHtml(order.gstRate)}%)</span><span>${money(order.igst)}</span></div>`
            : `<div class="row"><span>CGST (${Number(order.gstRate || 0) / 2}%)</span><span>${money(order.cgst)}</span></div><div class="row"><span>SGST (${Number(order.gstRate || 0) / 2}%)</span><span>${money(order.sgst)}</span></div>`;
        const content = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice #${escapeHtml(order.id)}</title><style>body{font:16px Arial,sans-serif;max-width:760px;margin:48px auto;color:#172033}h1{color:#8a6800}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:12px 0}.total{font-size:20px;font-weight:bold}small{color:#586174}@media print{button{display:none}}</style></head><body><h1>Cart24Seven — Order Invoice</h1><p>Order #${escapeHtml(order.id)}<br><small>${escapeHtml(order.orderDate ? new Date(order.orderDate).toLocaleString("en-IN") : "Date unavailable")}</small></p><h2>Seller tax details</h2><p>Seller: ${escapeHtml(order.sellerEmail || "Cart24Seven")}<br>GSTIN: ${escapeHtml(order.sellerGstin || "Not provided")}<br>Place of supply: ${escapeHtml(order.state || "Not recorded")}<br>HSN: ${escapeHtml(order.hsnCode || "Not provided")}</p><h2>Delivery details</h2><p>${escapeHtml(order.customerName)}<br>${escapeHtml(order.phone)}<br>${escapeHtml(address)}</p><h2>Item</h2><div class="row"><span>${escapeHtml(order.productName)} × ${escapeHtml(order.quantity)}</span><span>${money(Number(order.productPrice || 0) * Number(order.quantity || 1))}</span></div><div class="row"><span>Taxable value</span><span>${money(amounts.taxable)}</span></div>${taxBreakdown}<div class="row"><span>Total GST included</span><span>${money(amounts.gst)}</span></div><div class="row"><span>Delivery</span><span>${amounts.delivery ? money(amounts.delivery) : "Free"}</span></div><div class="row total"><span>Total paid (tax inclusive)</span><span>${money(amounts.total)}</span></div><p>Payment: ${escapeHtml(paymentLabel(order.paymentMethod))} · ${escapeHtml(order.paymentStatus || "Status unavailable")}</p><p><small>This is a system-generated order summary. Confirm supplier and tax registration details before using it as a statutory tax invoice.</small></p><button onclick="window.print()">Print / Save as PDF</button></body></html>`;
        const url = URL.createObjectURL(new Blob([content], { type: "text/html;charset=utf-8" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `Cart24Seven-invoice-${order.id}.html`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const emailSeller = (subject, body) => {
        if (!order?.sellerEmail) return;
        window.location.href = `mailto:${encodeURIComponent(order.sellerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };
    const address = order && [order.address, order.city, order.state, order.pincode].filter(Boolean).join(", ");
    const status = order?.orderStatus || "Placed";
    const currentStage = stages.indexOf(status);

    if (loading) return <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6"><div className="mx-auto max-w-6xl"><div className="skeleton-shimmer mb-5 h-5 w-40 rounded"/><div className="grid gap-5 lg:grid-cols-[1.7fr_0.9fr]"><div className="space-y-4">{[1,2,3].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-6"><div className="skeleton-shimmer h-6 w-1/3 rounded"/><div className="skeleton-shimmer mt-5 h-14 w-full rounded-xl"/><div className="skeleton-shimmer mt-4 h-5 w-2/3 rounded"/></div>)}</div><div className="space-y-4"><div className="skeleton-shimmer h-48 rounded-2xl"/><div className="skeleton-shimmer h-64 rounded-2xl"/></div></div></div></main>;
    if (error || !order) return <main className="min-h-screen bg-slate-100 px-5 py-10"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-8"><p role="alert" className="mb-5 text-red-700">{error || "Order not found."}</p><Link to="/my-orders" className="inline-flex items-center gap-2 font-semibold text-[#725700]"><ArrowLeft size={18}/>Back to My Orders</Link></div></main>;

    return <main className="min-h-screen bg-slate-100 px-4 py-7 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-6xl">
            <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500"><Link to="/" className="hover:text-[#725700]">Home</Link><span>›</span><Link to="/my-orders" className="hover:text-[#725700]">My Orders</Link><span>›</span><span className="text-slate-700">Order #{order.id}</span></nav>
            <Link to="/my-orders" className="mb-5 inline-flex items-center gap-2 font-semibold text-[#725700]"><ArrowLeft size={18}/>All orders</Link>
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
                <div className="space-y-4">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-slate-500">Order #{order.id}</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{status === "Delivered" ? "Delivered" : status === "Cancelled" ? "Cancelled" : "Your order is on its way"}</h1><p className="mt-1 text-sm text-slate-600">{status === "Cancelled" ? "This order was cancelled." : `Placed ${order.orderDate ? new Date(order.orderDate).toLocaleString("en-IN") : "date unavailable"}`}</p></div><span className={`rounded-full px-4 py-2 text-sm font-semibold ${status === "Delivered" ? "bg-emerald-100 text-emerald-800" : status === "Cancelled" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900"}`}>{status}</span></div>
                        {status === "Cancelled" ? <div className="rounded-xl bg-rose-50 p-4 text-rose-800">This order has been cancelled. Contact the seller if you need help with a refund.</div> : <ol className="grid gap-3 sm:grid-cols-4" aria-label="Order progress">{stages.map((stage, index) => { const done = currentStage >= index; return <li key={stage} className="flex items-center gap-3 sm:block"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>{done ? <Check size={18}/> : <span className="text-sm">{index + 1}</span>}</span><span className={`text-sm font-semibold ${done ? "text-slate-900" : "text-slate-400"}`}>{stage}</span>{index < stages.length - 1 && <span className={`hidden h-1 flex-1 rounded sm:mt-3 sm:block ${currentStage > index ? "bg-emerald-500" : "bg-slate-200"}`}/>}</li>; })}</ol>}
                        <button type="button" onClick={() => setShowUpdates((value) => !value)} className="mt-5 inline-flex items-center gap-2 font-semibold text-[#725700]">{showUpdates ? "Hide order updates" : "See all updates"}{showUpdates ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</button>
                        {showUpdates && <div className="mt-3 border-l-2 border-emerald-200 pl-4"><p className="font-semibold text-slate-800">Order {status.toLowerCase()}</p><p className="text-sm text-slate-500">{order.orderDate ? new Date(order.orderDate).toLocaleString("en-IN") : "Order date unavailable"}</p><p className="mt-2 text-sm text-slate-500">Progress updates appear here when the seller updates your order status.</p></div>}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row"><img src={resolveProductImage(order.productImage) || fallbackImage} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackImage; }} alt={order.productName || "Ordered product"} className="h-28 w-28 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-2"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">{order.productName || "Product"}</h2><p className="mt-1 text-slate-600">Quantity: {order.quantity} · {money(order.productPrice)} each</p></div><p className="font-bold text-slate-900">{money(amounts.total)}</p></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm">Payment: {paymentLabel(order.paymentMethod)}</span><span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{order.paymentStatus || "Status unavailable"}</span></div></div></div></section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="mb-4 text-lg font-bold text-slate-900">Need help with your order?</h2><div className="grid gap-3 sm:grid-cols-2"><button type="button" disabled={!order.sellerEmail || status === "Cancelled"} onClick={() => emailSeller(`Help with order #${order.id}`, `Hello, I need help with order #${order.id} (${order.productName}).`)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><MessageCircle size={18}/>Contact seller</button><button type="button" disabled={status !== "Delivered" || !order.sellerEmail} onClick={() => emailSeller(`Return request for order #${order.id}`, `Hello, I would like to request a return for order #${order.id} (${order.productName}). Please share the next steps.`)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw size={18}/>Request return</button></div><p className="mt-3 text-xs text-slate-500">{!order.sellerEmail ? "Seller contact details are not available for this order." : status !== "Delivered" ? "Return requests become available after delivery. Contact seller opens your email app." : "Contact and return requests open your email app with the order details filled in."}</p></section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="mb-1 text-lg font-bold text-slate-900">Rate your experience</h2><p className="text-sm text-slate-500">Your rating is saved in this browser for this order.</p><div className="mt-3 flex items-center gap-1" aria-label="Rate product from one to five stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`Rate ${value} out of 5`} onClick={() => { setRating(value); localStorage.setItem(storageKey, String(value)); toast("Thanks — your rating was saved in this browser.", "success"); }} className="rounded p-1 focus:outline-none focus:ring-2 focus:ring-amber-400"><Star size={28} className={value <= rating ? "fill-amber-400 text-amber-500" : "text-slate-400"}/></button>)}{rating > 0 && <span className="ml-2 text-sm text-slate-600">Your rating: {rating}/5</span>}</div><div className="mt-5 border-t border-slate-100 pt-4"><label htmlFor="delivery-feedback" className="font-semibold text-slate-800">How was your delivery experience?</label><select id="delivery-feedback" value={feedback} onChange={(event) => { setFeedback(event.target.value); localStorage.setItem(`${storageKey}-delivery`, event.target.value); toast("Delivery feedback saved.", "success"); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3"><option value="">Choose an option</option><option value="great">Great</option><option value="okay">Okay</option><option value="needs-improvement">Needs improvement</option></select></div></section>
                </div>

                <aside className="space-y-4 lg:sticky lg:top-5">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><button type="button" onClick={() => setShowDelivery((value) => !value)} className="flex w-full items-center justify-between text-left"><span className="text-lg font-bold text-slate-900">Delivery details</span>{showDelivery ? <ChevronUp size={19}/> : <ChevronDown size={19}/>}</button>{showDelivery && <div className="mt-4 space-y-4"><div className="flex gap-3 rounded-xl bg-slate-50 p-4"><MapPin size={19} className="mt-0.5 shrink-0 text-[#806300]"/><div><p className="font-semibold">Delivery address</p><p className="mt-1 text-sm text-slate-600">{address || "Address unavailable"}</p></div></div><div className="flex gap-3 rounded-xl bg-slate-50 p-4"><Package size={19} className="mt-0.5 shrink-0 text-[#806300]"/><div><p className="font-semibold">Recipient</p><p className="mt-1 text-sm text-slate-600">{order.customerName || "Name unavailable"}</p>{order.phone && <a href={`tel:${order.phone}`} className="mt-1 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"><Phone size={14}/>{order.phone}</a>}</div></div></div>}</section>
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><button type="button" onClick={() => setShowPrice((value) => !value)} className="flex w-full items-center justify-between text-left"><span className="text-lg font-bold text-slate-900">Price details</span>{showPrice ? <ChevronUp size={19}/> : <ChevronDown size={19}/>}</button>{showPrice && <><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-slate-600">Items total (incl. taxes)</span><span>{money(amounts.subtotal)}</span></div><div className="flex justify-between gap-3 text-slate-500"><span>Includes GST</span><span>{money(amounts.gst)}</span></div>{Number(order.igst || 0) > 0 ? <div className="flex justify-between gap-3 text-slate-500"><span>IGST ({order.gstRate}%)</span><span>{money(order.igst)}</span></div> : <><div className="flex justify-between gap-3 text-slate-500"><span>CGST ({Number(order.gstRate || 0) / 2}%)</span><span>{money(order.cgst)}</span></div><div className="flex justify-between gap-3 text-slate-500"><span>SGST ({Number(order.gstRate || 0) / 2}%)</span><span>{money(order.sgst)}</span></div></>}<div className="flex justify-between gap-3"><span className="text-slate-600">Delivery</span><span>{amounts.delivery ? money(amounts.delivery) : "FREE"}</span></div><div className="border-t border-dashed border-slate-300 pt-3"><div className="flex justify-between gap-3 text-base font-bold"><span>Total amount</span><span>{money(amounts.total)}</span></div></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Paid by</p><p className="mt-1 font-semibold text-slate-800">{paymentLabel(order.paymentMethod)}</p><p className={`mt-0.5 text-xs font-semibold ${order.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"}`}>{order.paymentStatus || "Payment status unavailable"}</p></div></div><button type="button" onClick={downloadInvoice} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50"><Download size={18}/>Download invoice</button><p className="mt-2 text-center text-xs text-slate-500">Print or save this tax breakdown as a PDF.</p></>}</section>
                    <p className="flex items-start gap-2 px-1 text-xs text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0"/>Order information is loaded from your account. Contact seller for support or return requests.</p>
                </aside>
            </div>
        </div>
    </main>;
}

export default OrderDetails;
