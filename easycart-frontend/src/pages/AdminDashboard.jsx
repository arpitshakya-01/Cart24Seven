import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Box, Boxes,
    CircleAlert, ClipboardList, Download, LayoutDashboard, Package, Plus,
    Search, Settings, ShieldCheck, ShoppingBag, ShoppingCart, Star, Users, UserRound,
} from "lucide-react";
import { useProducts } from "../context/ProductContext";
import { getAdminOrders } from "../services/orderService";
import api from "../services/api";

const categoryName = (product) => typeof product.category === "string" ? product.category : product.category?.categoryName || "Uncategorized";
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const stockLabel = (stock) => Number(stock || 0) <= 0 ? "Out of stock" : Number(stock) <= 5 ? "Low stock" : "In stock";

function exportProducts(products) {
    const columns = ["Product", "Brand", "Category", "Price", "Stock", "Seller", "Rating", "Product ID"];
    const value = (input) => `"${String(input ?? "").replace(/[\r\n]+/g, " ").replace(/"/g, '""')}"`;
    const rows = products.map((product) => [product.name, product.brand, categoryName(product), product.price, product.stock, product.sellerEmail || "Cart24Seven", product.rating, product.id]);
    const csv = [columns, ...rows].map((row) => row.map(value).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cart24seven-products.csv";
    anchor.click();
    URL.revokeObjectURL(url);
}

const sidebarItems = [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Products", to: "/admin/manage-products", icon: Boxes },
    { label: "Orders", to: "/admin/orders", icon: ClipboardList },
    { label: "Customers & roles", to: "/admin/customers", icon: Users },
    { label: "Admin profile", to: "/admin/profile", icon: UserRound },
];

function MetricCard({ label, value, caption, icon: Icon, tone, trend }) {
    const tones = {
        blue: "bg-blue-50 text-blue-700 ring-blue-100",
        green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        amber: "bg-amber-50 text-amber-700 ring-amber-100",
        violet: "bg-violet-50 text-violet-700 ring-violet-100",
        rose: "bg-rose-50 text-rose-700 ring-rose-100",
    };
    return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{value}</p></div><span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}><Icon size={21}/></span></div>
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">{trend === "up" ? <ArrowUpRight size={15} className="text-emerald-600"/> : trend === "down" ? <ArrowDownRight size={15} className="text-rose-600"/> : <Activity size={14} className="text-slate-400"/>}{caption}</div>
    </section>;
}

export default function AdminDashboard() {
    const { products, loading: productsLoading } = useProducts();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [taxLedger, setTaxLedger] = useState(null);
    const [summaryError, setSummaryError] = useState("");
    const [query, setQuery] = useState("");
    const [stockFilter, setStockFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    useEffect(() => {
        let active = true;
        Promise.allSettled([getAdminOrders(), api.get("/admin/users"), api.get("/orders/admin/tax-ledger")]).then((results) => {
            if (!active) return;
            const errors = [];
            if (results[0].status === "fulfilled") setOrders(results[0].value);
            else errors.push("orders");
            if (results[1].status === "fulfilled") setUsers(results[1].value.data);
            else errors.push("users");
            if (results[2].status === "fulfilled") setTaxLedger(results[2].value.data);
            else errors.push("tax ledger");
            if (errors.length) setSummaryError(`Could not load ${errors.join(" and ")}. Refresh the page to retry.`);
        });
        return () => { active = false; };
    }, []);

    const categories = useMemo(() => [...new Set(products.map(categoryName).filter((name) => name !== "Uncategorized"))].sort((a, b) => a.localeCompare(b)), [products]);
    const filteredProducts = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return products.filter((product) => {
            const category = categoryName(product);
            const stock = Number(product.stock || 0);
            const matchesQuery = !needle || [product.name, product.brand, category, product.sellerEmail, product.id].some((field) => String(field ?? "").toLowerCase().includes(needle));
            const matchesStock = stockFilter === "all" || (stockFilter === "available" && stock > 5) || (stockFilter === "low" && stock > 0 && stock <= 5) || (stockFilter === "out" && stock <= 0);
            return matchesQuery && matchesStock && (categoryFilter === "all" || category === categoryFilter);
        });
    }, [products, query, stockFilter, categoryFilter]);

    const activeProducts = products.filter((product) => Number(product.stock || 0) > 0).length;
    const lowStock = products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock) <= 5).length;
    const recentOrders = [...orders].sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0)).slice(0, 5);
    const metrics = [
        { label: "Total products", value: productsLoading ? "—" : products.length, caption: `${categories.length} product categories`, icon: Package, tone: "blue", trend: "steady" },
        { label: "Available listings", value: productsLoading ? "—" : activeProducts, caption: "Products with stock available", icon: ShoppingBag, tone: "green", trend: "up" },
        { label: "Low stock alerts", value: productsLoading ? "—" : lowStock, caption: lowStock ? "Listings need attention" : "Inventory looks healthy", icon: CircleAlert, tone: lowStock ? "amber" : "green", trend: lowStock ? "down" : "steady" },
        { label: "Platform orders", value: orders.length, caption: `${orders.filter((order) => order.orderStatus === "Delivered").length} delivered`, icon: ShoppingCart, tone: "violet", trend: "steady" },
        { label: "Registered accounts", value: users.length, caption: "Buyer, seller, and admin accounts", icon: Users, tone: "rose", trend: "steady" },
    ];

    return <main className="min-h-[calc(100vh-5rem)] bg-[#f5f7fb] text-slate-900">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1720px] lg:grid-cols-[236px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-white px-4 py-5 lg:border-b-0 lg:border-r lg:px-4 lg:py-7">
                <div className="mb-6 flex items-center gap-3 px-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white"><ShieldCheck size={21}/></div><div><p className="font-extrabold leading-tight text-slate-900">Cart24Seven</p><p className="text-xs font-semibold text-slate-500">ADMIN CONSOLE</p></div></div>
                <p className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
                <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto lg:flex-col">{sidebarItems.map(({ label, to, icon: Icon }) => {
                    const active = location.pathname === to || (to !== "/admin" && location.pathname.startsWith(to));
                    return <Link key={to} to={to} aria-current={active ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon size={18}/><span>{label}</span>{active && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-indigo-600 lg:block"/>}</Link>;
                })}</nav>
                <div className="mt-7 hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-4 text-white lg:block"><p className="text-sm font-bold">Need a product update?</p><p className="mt-1 text-xs leading-5 text-indigo-100">Create or revise a listing for the marketplace.</p><Link to="/admin/add-product" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/25">Add product <ArrowRight size={14}/></Link></div>
                <div className="mt-6 hidden border-t border-slate-100 pt-4 text-xs text-slate-400 lg:block">Cart24Seven · Admin tools</div>
            </aside>

            <div className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
                <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
                    <div><p className="text-sm font-semibold text-slate-500">Workspace / Overview</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Admin Dashboard</h1><p className="mt-1 text-sm text-slate-500">Monitor listings, orders, and account activity.</p></div>
                    <div className="flex items-center gap-2"><Link to="/admin/add-product" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"><Plus size={18}/>Add Product</Link><Link to="/admin/profile" aria-label="Admin profile" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><UserRound size={19}/></Link></div>
                </header>

                {summaryError && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{summaryError}</p>}

                <section aria-label="Platform summary" className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <MetricCard key={metric.label} {...metric}/>)}</section>

                <section className="mb-7 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><ShieldCheck size={20} className="text-indigo-700"/><h2 className="text-lg font-extrabold text-slate-900">Tax ledger & marketplace fees</h2></div><p className="mt-1 text-sm text-slate-500">Platform order totals include estimates for COD and simulated demo orders.</p></div><Link to="/admin/customers" className="text-sm font-bold text-indigo-700 hover:underline">Seller compliance →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["GST included in orders", taxLedger?.gstCollected], ["CGST", taxLedger?.cgst], ["SGST", taxLedger?.sgst], ["IGST", taxLedger?.igst], ["TCS total", taxLedger?.tcs], ["TCS CGST", taxLedger?.tcsCgst], ["TCS SGST", taxLedger?.tcsSgst], ["TCS IGST", taxLedger?.tcsIgst], ["Marketplace commission", taxLedger?.commission], ["GST on commission (18%)", taxLedger?.commissionGst]].map(([label, amount])=><div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-lg font-extrabold text-slate-900">{taxLedger ? money(amount) : "—"}</p></div>)}</div><p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">TCS is estimated at 0.5% of taxable marketplace supplies only for captured online payments. COD and simulated payments do not represent platform-collected consideration. Use this ledger for review, not as a filed return.</p><p className="mt-2 text-xs text-slate-500">Seller commission is set on each listing; GST on platform commission is shown at 18%. TCS rate follows the current 0.5% marketplace rate (0.25% CGST + 0.25% SGST intra-state, or 0.5% IGST inter-state).</p></section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6"><div><div className="flex items-center gap-2"><Boxes size={20} className="text-indigo-600"/><h2 className="text-lg font-extrabold text-slate-900">Product management</h2></div><p className="mt-1 text-sm text-slate-500">Search inventory and review stock at a glance.</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => exportProducts(filteredProducts)} disabled={!filteredProducts.length} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><Download size={16}/>Export CSV</button><Link to="/admin/manage-products" className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 sm:inline-flex">All products<ArrowRight size={15}/></Link></div></div>
                    <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-[minmax(220px,1fr)_180px_180px] sm:px-6">
                        <label className="relative block"><span className="sr-only">Search products</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by product, brand, or seller" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/></label>
                        <label><span className="sr-only">Filter by stock</span><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"><option value="all">All stock statuses</option><option value="available">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></label>
                        <label><span className="sr-only">Filter by category</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                    </div>
                    <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-white text-[11px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 sm:px-6">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Stock status</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Seller</th><th className="px-4 py-3">Rating</th><th className="px-5 py-3 text-right sm:px-6">Action</th></tr></thead><tbody className="divide-y divide-slate-100">
                        {productsLoading ? <tr><td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">Loading product listings…</td></tr> : filteredProducts.slice(0, 10).map((product) => {
                            const stock = Number(product.stock || 0);
                            const label = stockLabel(stock);
                            const badge = label === "In stock" ? "bg-emerald-50 text-emerald-700" : label === "Low stock" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700";
                            return <tr key={product.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-3.5 sm:px-6"><div className="flex min-w-56 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">{product.image ? <img src={product.image} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "https://placehold.co/120x120?text=Product"; }} className="h-full w-full object-contain p-1"/> : <Package size={18} className="text-slate-400"/>}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{product.name || "Untitled product"}</p><p className="mt-0.5 text-xs text-slate-500">SKU · EC-{String(product.id).padStart(5, "0")}</p></div></div></td><td className="px-4 py-3.5 text-sm text-slate-600">{categoryName(product)}</td><td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge}`}>{label}{label === "Low stock" ? ` · ${stock}` : ""}</span></td><td className="px-4 py-3.5 text-sm font-bold text-slate-800"><div>{money(product.price)}</div>{Number(product.mrp) > Number(product.price) && <div className="text-xs font-normal text-slate-400 line-through">{money(product.mrp)} MRP</div>}</td><td className="max-w-40 truncate px-4 py-3.5 text-sm text-slate-600">{product.sellerEmail || "Cart24Seven"}</td><td className="px-4 py-3.5"><span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700"><Star size={14} className="fill-amber-400 text-amber-400"/>{Number(product.rating || 0) > 0 ? Number(product.rating).toFixed(1) : "—"}</span></td><td className="px-5 py-3.5 text-right sm:px-6"><Link to={`/admin/edit-product/${product.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Edit</Link></td></tr>;
                        })}
                        {!productsLoading && filteredProducts.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center"><Package size={28} className="mx-auto text-slate-300"/><p className="mt-2 font-semibold text-slate-700">No products match these filters</p><p className="mt-1 text-sm text-slate-500">Try another search or stock status.</p></td></tr>}
                    </tbody></table></div>
                    {!productsLoading && filteredProducts.length > 10 && <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500 sm:px-6"><span>Showing 10 of {filteredProducts.length} matching products</span><Link to="/admin/manage-products" className="font-bold text-indigo-700 hover:text-indigo-900">Open product manager →</Link></div>}
                </section>

                <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-extrabold text-slate-900">Recent orders</h2><p className="mt-0.5 text-sm text-slate-500">Latest activity across the marketplace</p></div><Link to="/admin/orders" className="text-sm font-bold text-indigo-700 hover:text-indigo-900">View all</Link></div><div className="divide-y divide-slate-100">{recentOrders.length ? recentOrders.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><ShoppingCart size={17}/></span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">Order #{order.id} · {order.customerName || "Buyer"}</p><p className="truncate text-xs text-slate-500">{order.productName || "Order item"} · {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "Date unavailable"}</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{order.orderStatus || "Placed"}</span></div>) : <p className="px-5 py-8 text-center text-sm text-slate-500">Orders will appear here when buyers check out.</p>}</div></section>
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><BarChart3 size={19} className="text-indigo-600"/><h2 className="font-extrabold text-slate-900">Quick actions</h2></div><div className="mt-4 space-y-2"><Link to="/admin/add-product" className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-100 hover:bg-indigo-50"><span className="flex items-center gap-2"><Plus size={17} className="text-indigo-600"/>Create a listing</span><ArrowRight size={16}/></Link><Link to="/admin/customers" className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-100 hover:bg-indigo-50"><span className="flex items-center gap-2"><Users size={17} className="text-indigo-600"/>Manage accounts</span><ArrowRight size={16}/></Link><Link to="/admin/profile" className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-100 hover:bg-indigo-50"><span className="flex items-center gap-2"><Settings size={17} className="text-indigo-600"/>Admin profile details</span><ArrowRight size={16}/></Link></div></section>
                </div>
            </div>
        </div>
    </main>;
}
