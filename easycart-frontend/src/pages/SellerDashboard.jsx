import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BarChart3, CircleDollarSign, ClipboardList, Package, PlusCircle, RefreshCw, Tags, TrendingUp, FileSpreadsheet, ShieldCheck } from "lucide-react";
import api from "../services/api";

const money = (value) => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const cancelled = (order) => (order.orderStatus || "").toLowerCase() === "cancelled";
const orderRevenue = (order) => Number(order.subtotal ?? (Number(order.productPrice || 0) * Number(order.quantity || 0)));
const paymentLabel = (method) => method?.startsWith("DEMO_") ? `Demo · ${method.slice(5).replaceAll("_", " ")}` : method || "Legacy order";
const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function SellerDashboard() {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [compliance, setCompliance] = useState({ gstin: "", gstinStatus: "NOT_SUBMITTED", businessState: "" });
    const [complianceSaved, setComplianceSaved] = useState("");
    const refresh = async () => {
        setLoading(true); setError("");
        try {
            const [p, o, c] = await Promise.all([api.get("/seller/products"), api.get("/orders/seller/orders"), api.get("/seller/compliance")]);
            setProducts(p.data); setOrders(o.data); setCompliance(c.data);
        } catch (err) { setError(err.response?.data?.message || "Could not load your seller dashboard."); }
        finally { setLoading(false); }
    };
    useEffect(() => { refresh(); }, []);

    const lowStock = useMemo(() => products.filter((p) => Number(p.stock || 0) <= 5), [products]);
    const activeOrders = useMemo(() => orders.filter((order) => !cancelled(order) && !String(order.paymentMethod || "").startsWith("DEMO") && order.paymentStatus !== "UNPAID"), [orders]);
    const revenue = useMemo(() => activeOrders.reduce((sum, order) => sum + orderRevenue(order), 0), [activeOrders]);
    const productById = useMemo(() => new Map(products.map((product) => [String(product.id), product])), [products]);
    const profitData = useMemo(() => {
        let profit = 0;
        let covered = 0;
        activeOrders.forEach((order) => {
            const unitCost = order.productCostPrice;
            if (unitCost !== null && unitCost !== undefined && Number.isFinite(Number(unitCost))) {
                const sellingPrice = Number(order.taxableValue ?? order.productPrice ?? 0);
                const operatingCost = Number(order.productOperatingCost || 0);
                profit += Number(order.netSellerPayout ?? (sellingPrice - Number(order.marketplaceCommission || 0) - Number(order.commissionGst || 0) - Number(order.tcs || 0))) - (Number(unitCost) + operatingCost) * Number(order.quantity || 0);
                covered += 1;
            }
        });
        return { profit, covered, total: activeOrders.length };
    }, [activeOrders]);
    const salesByType = useMemo(() => {
        const totals = new Map();
        activeOrders.forEach((order) => {
            const product = productById.get(String(order.productId));
            const type = product?.category?.categoryName || product?.category || "Other";
            const current = totals.get(type) || { quantity: 0, revenue: 0 };
            current.quantity += Number(order.quantity || 0);
            current.revenue += orderRevenue(order);
            totals.set(type, current);
        });
        return [...totals.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
    }, [activeOrders, productById]);
    const salesByPayment = useMemo(() => {
        const totals = new Map();
        activeOrders.forEach((order) => {
            const method = paymentLabel(order.paymentMethod);
            const current = totals.get(method) || { count: 0, revenue: 0 };
            current.count += 1;
            current.revenue += orderRevenue(order);
            totals.set(method, current);
        });
        return [...totals.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
    }, [activeOrders]);
    const statusCounts = useMemo(() => ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => ({
        status,
        count: orders.filter((order) => (order.orderStatus || "").toLowerCase() === status.toLowerCase()).length,
    })), [orders]);

    const updateStatus = async (order, status) => {
        try { await api.patch("/orders/seller/" + order.id + "/status", { status }); await refresh(); }
        catch (err) { setError(err.response?.data?.message || "Could not update order."); }
    };
    const saveCompliance = async (event) => {
        event.preventDefault(); setError(""); setComplianceSaved("");
        try { const result = await api.put("/seller/compliance", compliance); setCompliance(result.data); setComplianceSaved("Your seller GSTIN and business state were submitted for admin review."); }
        catch (err) { setError(err.response?.data?.message || "Could not save seller tax details."); }
    };
    const downloadMonthlyCsv = () => {
        const date = new Date(); const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthOrders = orders.filter(o => !cancelled(o) && String(o.orderDate || "").slice(0, 7) === monthKey);
        const headers = ["Order ID", "Order date", "HSN code", "Taxable value", "GST rate (%)", "CGST", "SGST", "IGST", "GST total", "Gross paid", "Marketplace commission", "GST on commission (18%)", "TCS (0.5% when applicable)", "Net seller payout", "Payment status"];
        const rows = monthOrders.map(o => [o.id, o.orderDate, o.hsnCode, o.taxableValue, o.gstRate, o.cgst, o.sgst, o.igst, o.gst, o.subtotal, o.marketplaceCommission, o.commissionGst, o.tcs, o.netSellerPayout, o.paymentStatus]);
        const blob = new Blob(["\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
        const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `seller-gst-report-${monthKey}.csv`; link.click(); URL.revokeObjectURL(link.href);
    };
    const metrics = [
        { label: "Gross buyer amount", value: money(revenue), detail: "Includes GST; excludes demo, unpaid, and cancelled orders", icon: <CircleDollarSign size={25}/>, color: "text-emerald-700", background: "bg-emerald-50" },
        { label: "Estimated profit", value: profitData.covered ? money(profitData.profit) : "Add cost prices", detail: profitData.covered ? `Cost recorded for ${profitData.covered} of ${profitData.total} active orders` : "Enter product cost when adding or editing listings", icon: <TrendingUp size={25}/>, color: "text-violet-700", background: "bg-violet-50" },
        { label: "Orders", value: orders.length, detail: `${activeOrders.length} active · ${orders.filter(cancelled).length} cancelled`, icon: <ClipboardList size={25}/>, color: "text-blue-700", background: "bg-blue-50" },
        { label: "Low stock", value: lowStock.length, detail: "Products with 5 or fewer units", icon: <AlertTriangle size={25}/>, color: "text-amber-700", background: "bg-amber-50" },
        { label: "Net seller payout", value: money(activeOrders.reduce((sum, o) => sum + Number(o.netSellerPayout || 0), 0)), detail: "After product GST, commission, fee GST, and applicable TCS", icon: <CircleDollarSign size={25}/>, color: "text-cyan-700", background: "bg-cyan-50" },
    ];

    return <main className="min-h-screen bg-[#f6f6f4] p-5 sm:p-8"><div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-extrabold text-[#111111]">Seller <span className="text-[#b38a00]">Dashboard</span></h1><p className="mt-1 text-slate-600">Track your revenue, estimated profit, inventory, and sales.</p></div><div className="flex flex-wrap gap-2"><button onClick={refresh} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-amber-50"><RefreshCw className="mr-1 inline" size={17}/>Refresh</button><Link to="/seller/manage-products" className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-amber-50">My products</Link><Link to="/seller/add-product" className="rounded-xl bg-[#FFD21F] px-4 py-2 font-bold text-[#111111] hover:bg-[#E8B900]"><PlusCircle className="mr-1 inline" size={17}/>Add product</Link></div></header>
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-100 p-3 text-red-700">{error}</p>}
        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-slate-600">{metric.label}</p><p className={`mt-2 text-2xl font-extrabold ${metric.color}`}>{loading ? "…" : metric.value}</p></div><span className={`rounded-xl p-3 ${metric.background} ${metric.color}`}>{metric.icon}</span></div><p className="mt-3 text-xs leading-5 text-slate-500">{metric.detail}</p></article>)}</section>

        <div className="mb-7 grid gap-5 lg:grid-cols-2">
            <form onSubmit={saveCompliance} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-bold"><ShieldCheck className="text-emerald-700"/>Seller tax registration</h2><p className="mt-1 text-sm text-slate-500">GSTIN status: <strong>{compliance.gstinStatus?.replaceAll("_", " ")}</strong>. Admin review is manual; this does not verify your GSTIN with GSTN.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">GSTIN<input value={compliance.gstin} onChange={e=>setCompliance({...compliance,gstin:e.target.value.toUpperCase()})} maxLength="15" className="mt-1 w-full rounded-lg border p-3" placeholder="15-character GSTIN"/></label><label className="text-sm font-semibold">Business state<input value={compliance.businessState} onChange={e=>setCompliance({...compliance,businessState:e.target.value})} className="mt-1 w-full rounded-lg border p-3" placeholder="State of registration"/></label></div>{complianceSaved&&<p role="status" className="mt-3 text-sm text-emerald-700">{complianceSaved}</p>}<button className="mt-4 rounded-xl bg-[#111111] px-4 py-2 font-semibold text-white">Save for review</button></form>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-bold"><FileSpreadsheet className="text-emerald-700"/>Monthly GST report</h2><p className="mt-2 text-sm text-slate-600">Download this month’s order and tax lines with HSN, taxable value, GST components, commission, and estimated TCS.</p><button onClick={downloadMonthlyCsv} className="mt-5 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800">Download current month CSV</button><p className="mt-2 text-xs text-slate-500">Reports are estimates generated from order records; demo and legacy records should be reviewed before filing.</p></section>
        </div>

        <div className="mb-7 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-[#111111]"><Tags className="text-[#a78000]" size={22}/>Sales by type</h2><p className="mb-4 text-sm text-slate-500">Grouped by product category</p>{salesByType.length ? <div className="space-y-3">{salesByType.map(([type, totals]) => <div key={type} className="flex items-center justify-between gap-4 rounded-xl bg-[#faf9f4] p-4"><div><p className="font-semibold text-slate-900">{type}</p><p className="text-sm text-slate-500">{totals.quantity} item{totals.quantity === 1 ? "" : "s"} sold</p></div><strong className="text-[#6f5500]">{money(totals.revenue)}</strong></div>)}</div> : <p className="rounded-xl bg-slate-50 p-5 text-slate-500">Sales by category will appear when orders arrive.</p>}<p className="mt-4 text-xs text-slate-500">Payment method is also recorded for each order.</p></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#111111]"><BarChart3 className="text-violet-700" size={22}/>Sales by order stage</h2><div className="space-y-4">{statusCounts.map(({ status, count }) => <div key={status}><div className="mb-1 flex justify-between text-sm"><span className="font-medium text-slate-700">{status}</span><span className="text-slate-500">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${status === "Delivered" ? "bg-emerald-500" : status === "Cancelled" ? "bg-rose-500" : "bg-[#d6a900]"}`} style={{ width: `${orders.length ? (count / orders.length) * 100 : 0}%` }}/></div></div>)}</div><p className="mt-4 text-xs text-slate-500">Estimated profit deducts unit cost, operating cost, and the recorded marketplace fee from sales. Older orders without cost snapshots are excluded.</p></section>
        </div>

        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-bold text-[#111111]">Sales by payment method</h2>{salesByPayment.length ? <div className="grid gap-3 sm:grid-cols-2">{salesByPayment.map(([method, totals]) => <div key={method} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">{method}</p><p className="mt-1 text-sm text-slate-600">{totals.count} order{totals.count === 1 ? "" : "s"}</p><strong className="mt-2 block text-[#6f5500]">{money(totals.revenue)}</strong></div>)}</div> : <p className="text-slate-500">Payment totals appear when orders arrive.</p>}</section>

        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#111111]"><Package className="text-[#a78000]" size={22}/>Inventory and low stock</h2>{products.length===0&&!loading?<p className="text-slate-500">No products belong to this seller yet.</p>:<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b bg-[#111111] text-[#FFD21F]"><th className="p-3">Product</th><th className="p-3">Buyer price / MRP</th><th className="p-3">Base price</th><th className="p-3">GST / HSN status</th><th className="p-3">Stock</th><th className="p-3">Media / reviews</th><th className="p-3">Inventory status</th></tr></thead><tbody>{products.map(p=><tr key={p.id} className="border-b border-slate-100 hover:bg-amber-50/70"><td className="p-3">{p.productName}</td><td className="p-3"><div>{money(p.price)} <small className="text-slate-500">incl. GST</small></div>{Number(p.mrp) > Number(p.price) && <div className="text-xs text-slate-400 line-through">{money(p.mrp)} MRP</div>}</td><td className="p-3">{money(p.basePrice)}</td><td className="p-3">{Number(p.gstRate || 0)}% · {p.hsnCode || "No HSN"}<small className={`block text-xs font-semibold ${p.hsnVerified ? "text-emerald-700" : "text-amber-700"}`}>{p.hsnVerified ? "Verified" : "Awaiting admin review"}</small></td><td className="p-3">{p.stock??0}</td><td className="p-3 text-sm">{(p.media||[]).length} media<br/><span className="text-slate-500">{Number(p.rating||0).toFixed(1)} ★ · {p.reviewCount||0} reviews</span></td><td className="p-3">{Number(p.stock||0)<=5?<span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Low stock</span>:<span className="text-emerald-700">In stock</span>}</td></tr>)}</tbody></table></div>}</section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-bold text-[#111111]">Orders for your products</h2>{orders.length===0&&!loading?<p className="text-slate-500">No seller orders yet.</p>:<div className="space-y-3">{orders.map(o=><article key={o.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><p className="font-semibold">{o.productName} × {o.quantity}</p><p className="text-sm text-slate-600">{o.customerName} · {o.orderStatus} · Gross paid {money(o.subtotal ?? o.totalAmount)}</p><p className="mt-1 text-xs text-slate-600">Taxable {money(o.taxableValue)} · GST {money(o.gst)} · Commission {money(o.marketplaceCommission)} + fee GST {money(o.commissionGst)} · TCS {money(o.tcs)}</p><p className="mt-1 text-sm font-bold text-emerald-800">Estimated net seller payout: {money(o.netSellerPayout)}</p><p className="mt-1 text-xs font-semibold text-slate-500">{paymentLabel(o.paymentMethod)} · {o.paymentStatus||"Payment status unavailable"}</p></div><select aria-label={"Update order " + o.id + " status"} value={o.orderStatus} onChange={e=>updateStatus(o,e.target.value)} className="rounded-lg border border-slate-300 p-2 focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]">{["Placed","Processing","Shipped","Delivered","Cancelled"].map(s=><option key={s}>{s}</option>)}</select></article>)}</div>}</section>
    </div></main>;
}
