import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Truck, ShieldCheck, CreditCard, Banknote } from "lucide-react";
import { cancelRazorpayAttempt, createRazorpayOrder, getMyOrders, getPaymentConfig, placeDemoPayment, placeOrder, verifyRazorpayPayment } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { resolveProductImage } from "../services/resolveProductImage";
import lenovoImage from "../assets/lenovo-loq-rtx5050.png";
import { calculateDeliveryCharge } from "../utils/deliveryCharge";

const DEMO_METHODS = [
    { value: "UPI", label: "UPI", detail: "Simulate a UPI checkout" },
    { value: "DEBIT_CARD", label: "Debit card", detail: "Simulate a debit card checkout" },
    { value: "CREDIT_CARD", label: "Credit card", detail: "Simulate a credit card checkout" },
    { value: "NET_BANKING", label: "Netbanking", detail: "Simulate a bank checkout" },
];

const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => reject(new Error("Could not load Razorpay checkout.")), { once: true });
        return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
});

function Checkout() {
    const { cartItems, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [demoMethod, setDemoMethod] = useState("UPI");
    const [razorpayConfig, setRazorpayConfig] = useState({ razorpayEnabled: false, keyId: "", demoPaymentEnabled: false });
    const [address, setAddress] = useState({ fullName: user?.name || "", phone: "", city: "", state: "", pincode: "", addressLine: "" });

    useEffect(() => {
        api.get("/buyer/profile").then(r => setAddress(prev => ({ ...prev, fullName: r.data.name || user?.name || "", phone: r.data.phone || "", city: r.data.city || "", state: r.data.state || "", pincode: r.data.pincode || "", addressLine: r.data.addressLine || "" }))).catch(() => {});
        getPaymentConfig().then(setRazorpayConfig).catch(() => {});
    }, [user?.email, user?.name]);

    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const gst = cartItems.reduce((sum, item) => {
        const rate = Number(item.gstRate ?? 18);
        return sum + Number(item.price || 0) * Number(item.quantity || 0) * rate / (100 + rate);
    }, 0);
    const deliveryCharge = cartItems.length ? calculateDeliveryCharge(subtotal) : 0;
    const totalAmount = subtotal + deliveryCharge;
    const handleChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!cartItems.length) { setError("Your cart is empty."); return; }
        setSubmitting(true); setError("");
        try {
            if (paymentMethod === "COD") {
                const orders = await placeOrder(address);
                await clearCart();
                navigate("/order-success", { state: { order: orders[0], orders } });
                return;
            }
            if (paymentMethod === "DEMO") {
                const orders = await placeDemoPayment(address, demoMethod);
                await clearCart();
                navigate("/order-success", { state: { order: orders[0], orders } });
                return;
            }
            if (!razorpayConfig.razorpayEnabled) throw new Error("Online payment is not configured yet. Please choose Cash on Delivery.");
            await loadRazorpay();
            const paymentOrder = await createRazorpayOrder(address);
            const options = {
                key: paymentOrder.keyId,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                name: "Cart24Seven",
                description: "Secure online payment",
                order_id: paymentOrder.orderId,
                prefill: { name: address.fullName, email: user?.email || "", contact: address.phone },
                theme: { color: "#f5c518" },
                handler: async (response) => {
                    try {
                        await verifyRazorpayPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        const orders = await getMyOrders();
                        await clearCart();
                        navigate("/order-success", { state: { order: orders[0], orders } });
                    } catch (verificationError) {
                        setError(verificationError.response?.data?.message || "We could not confirm the payment. Contact support before trying again.");
                        setSubmitting(false);
                    }
                },
                modal: { ondismiss: async () => { try { await cancelRazorpayAttempt(paymentOrder.attemptId); } catch {} setSubmitting(false); } },
            };
            const checkout = new window.Razorpay(options);
            checkout.on("payment.failed", (response) => {
                setError(response.error?.description || "Payment was not completed. Your cart is unchanged; please retry.");
                setSubmitting(false);
            });
            checkout.open();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Could not place your order. Please retry.");
            setSubmitting(false);
        }
    };

    return <div className="min-h-screen bg-slate-100 px-5 py-10"><div className="mx-auto max-w-7xl">
        <Link to="/cart" className="mb-5 inline-flex items-center gap-2 font-semibold text-[#6f5500]"><ArrowLeft size={20}/>Back to Cart</Link>
        <h1 className="mb-8 text-center text-4xl font-bold text-[#6f5500]">Checkout</h1>
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-100 p-3 text-red-700">{error}</p>}
        <div className="grid gap-8 lg:grid-cols-2"><section className="rounded-3xl bg-white p-8 shadow-lg"><div className="mb-6 flex items-center gap-3"><Truck className="text-[#b38a00]" size={28}/><h2 className="text-2xl font-bold">Delivery Address</h2></div>
        <form onSubmit={handlePlaceOrder} className="space-y-4">
            <input name="fullName" placeholder="Full Name" value={address.fullName} onChange={handleChange} className="w-full rounded-xl border p-3" required/>
            <input name="phone" inputMode="tel" placeholder="Phone Number" value={address.phone} onChange={handleChange} className="w-full rounded-xl border p-3" required/>
            <textarea rows="3" name="addressLine" placeholder="House No, Street, Area" value={address.addressLine} onChange={handleChange} className="w-full rounded-xl border p-3" required/>
            <div className="grid grid-cols-2 gap-3"><input name="city" placeholder="City" value={address.city} onChange={handleChange} className="rounded-xl border p-3" required/><input name="state" placeholder="State" value={address.state} onChange={handleChange} className="rounded-xl border p-3" required/></div>
            <input name="pincode" placeholder="PIN Code" value={address.pincode} onChange={handleChange} className="w-full rounded-xl border p-3" required/>
            <fieldset className="space-y-3"><legend className="mb-2 font-bold">Payment method</legend>
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === "COD" ? "border-[#b38a00] bg-[#fff9df]" : "border-gray-200"}`}>
                    <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")}/><Banknote className="text-[#6f5500]"/><span><b>Cash on Delivery</b><small className="block text-gray-500">Pay when your order arrives</small></span>
                </label>
                <label className={`flex items-center gap-3 rounded-xl border p-4 ${razorpayConfig.razorpayEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"} ${paymentMethod === "RAZORPAY" ? "border-[#b38a00] bg-[#fff9df]" : "border-gray-200"}`}>
                    <input type="radio" name="paymentMethod" value="RAZORPAY" checked={paymentMethod === "RAZORPAY"} disabled={!razorpayConfig.razorpayEnabled} onChange={() => setPaymentMethod("RAZORPAY")}/><CreditCard className="text-[#6f5500]"/><span><b>Pay Online with Razorpay</b><small className="block text-gray-500">UPI, cards, netbanking and other enabled methods</small></span>
                </label>
                {!razorpayConfig.razorpayEnabled && !razorpayConfig.demoPaymentEnabled && <p className="text-xs text-gray-500">Online payments are not configured. Cash on Delivery is available.</p>}
                {razorpayConfig.demoPaymentEnabled && <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === "DEMO" ? "border-violet-500 bg-violet-50" : "border-gray-200"}`}>
                    <input type="radio" name="paymentMethod" value="DEMO" checked={paymentMethod === "DEMO"} onChange={() => setPaymentMethod("DEMO")}/><CreditCard className="text-violet-700"/><span><b>Try demo online payment</b><small className="block text-violet-700">Simulation only — no money is charged or transferred</small></span>
                </label>}
                {paymentMethod === "DEMO" && <p className="rounded-lg bg-violet-50 p-3 text-sm text-violet-800">This is a local demonstration. It does not contact a bank or payment merchant. The order will be marked SIMULATED.</p>}
                {paymentMethod === "DEMO" && <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Choose a demo payment type">{DEMO_METHODS.map(method => <label key={method.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${demoMethod === method.value ? "border-violet-500 bg-violet-50" : "border-gray-200"}`}><input type="radio" name="demoMethod" value={method.value} checked={demoMethod === method.value} onChange={() => setDemoMethod(method.value)}/><span><b>{method.label}</b><small className="block text-gray-500">{method.detail}</small></span></label>)}</div>}
            </fieldset>
            <button disabled={submitting || !cartItems.length} className="w-full rounded-xl bg-[#FFD21F] py-3 text-lg font-bold text-[#111111] hover:bg-[#E8B900] disabled:opacity-50">{submitting ? "Processing…" : paymentMethod === "COD" ? "Place Order · Cash on Delivery" : paymentMethod === "DEMO" ? `Simulate ${demoMethod.replaceAll("_", " ")} · no charge` : "Continue to Secure Payment"}</button>
        </form></section>
        <section className="h-fit rounded-3xl bg-white p-8 shadow-lg"><h2 className="mb-6 text-2xl font-bold text-[#6f5500]">Order Summary</h2>{cartItems.length === 0 ? <p className="text-gray-500">Your cart is empty.</p> : <><div className="space-y-5">{cartItems.map(item => <div key={item.id} className="flex items-center gap-4 border-b pb-4"><img src={resolveProductImage(item.image) || lenovoImage} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=lenovoImage;}} alt={item.name} className="h-20 w-20 rounded-xl bg-gray-100 object-contain p-2"/><div className="flex-1"><h3 className="font-bold">{item.name || item.productName}</h3><p className="text-sm text-gray-500">Qty: {item.quantity}</p><p className="font-semibold text-[#6f5500]">₹{Number(item.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}{Number(item.mrp) > Number(item.price) && <span className="ml-2 text-sm text-slate-400 line-through">₹{Number(item.mrp).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>}<small className="ml-2 text-xs text-slate-500">Incl. of GST</small></p></div><p className="font-bold">₹{(Number(item.price) * Number(item.quantity)).toLocaleString("en-IN")}</p></div>)}</div><div className="mt-7 space-y-3"><p className="flex justify-between"><span>Subtotal (tax inclusive)</span><span>₹{subtotal.toFixed(2)}</span></p><p className="flex justify-between text-sm text-slate-500"><span>Includes GST</span><span>₹{gst.toFixed(2)}</span></p><p className="flex justify-between"><span>Delivery</span><span>{deliveryCharge === 0 ? "FREE" : "₹" + deliveryCharge}</span></p><p className="text-sm text-slate-500">{subtotal >= 499 ? "Free delivery applied on orders of ₹499 or more." : `₹40 delivery applies below ₹499. Add ₹${(499 - subtotal).toFixed(2)} for free delivery.`}</p><hr/><p className="flex justify-between text-2xl font-bold text-[#6f5500]"><span>Total</span><span>₹{totalAmount.toFixed(2)}</span></p><p className="flex items-center gap-2 rounded-xl bg-[#fff9df] p-3 text-[#6f5500]"><ShieldCheck size={20}/>Inclusive product prices · total confirmed by the server</p></div><Link to="/" className="mt-5 block rounded-xl border-2 border-[#d6a900] py-3 text-center font-semibold text-[#6f5500] hover:bg-[#fff9df]">Continue Shopping</Link></>}</section></div>
    </div></div>;
}

export default Checkout;
