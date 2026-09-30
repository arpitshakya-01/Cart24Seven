import { ArrowUpRight, Heart, Mail, Package, ShieldCheck, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
    const { role } = useAuth();
    const isBuyer = role === "BUYER";
    const portal = role === "ADMIN" ? ["Admin dashboard", "/admin", ShieldCheck] : role === "SELLER" ? ["Seller dashboard", "/seller", Store] : ["My orders", "/my-orders", Package];
    const PortalIcon = portal[2];
    return <footer className="mt-auto border-t border-slate-800 bg-[#10151f] text-slate-200">
        <div className="mx-auto grid max-w-screen-2xl gap-9 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12 lg:py-14">
            <div><Link to={role === "ADMIN" ? "/admin" : role === "SELLER" ? "/seller" : "/"} className="inline-flex items-center gap-2 text-xl font-extrabold text-white"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFD21F] text-[#171717]"><Store size={19}/></span>Cart<span className="text-[#FFD21F]">24Seven</span></Link><p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">Shop anytime, anywhere. Discover products from our marketplace and keep your orders close at hand.</p></div>
            <div><h2 className="font-bold text-white">Explore</h2><ul className="mt-3 space-y-2.5 text-sm text-slate-400">{isBuyer && <><li><Link className="hover:text-[#FFD21F]" to="/">Home</Link></li><li><Link className="hover:text-[#FFD21F]" to="/categories">Categories</Link></li><li><Link className="inline-flex items-center gap-2 hover:text-[#FFD21F]" to="/wishlist"><Heart size={15}/>Wishlist</Link></li></>}</ul></div>
            <div><h2 className="font-bold text-white">Your account</h2><ul className="mt-3 space-y-2.5 text-sm text-slate-400"><li><Link className="inline-flex items-center gap-2 hover:text-[#FFD21F]" to={portal[1]}><PortalIcon size={15}/>{portal[0]}</Link></li>{!role && <li><Link className="hover:text-[#FFD21F]" to="/login">Sign in</Link></li>}</ul></div>
            <div><h2 className="font-bold text-white">Need help?</h2><p className="mt-3 text-sm leading-6 text-slate-400">For an order question, open the order from My Orders and contact its seller.</p><Link to={isBuyer ? "/my-orders" : role === "ADMIN" ? "/admin/orders" : "/seller"} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#FFD21F] hover:text-white">Go to orders <ArrowUpRight size={15}/></Link><p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Mail size={14}/>Support options are shown with your order details.</p></div>
        </div>
        <div className="border-t border-white/10"><div className="mx-auto flex max-w-screen-2xl flex-col gap-2 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© {new Date().getFullYear()} Cart24Seven. All rights reserved.</span><span>Secure shopping · Buyer, seller, and admin portals</span></div></div>
    </footer>;
}
