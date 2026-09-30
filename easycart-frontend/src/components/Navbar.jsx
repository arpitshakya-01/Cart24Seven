import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutDashboard, UserRound, Clock3, Moon, Sun } from "lucide-react";
import { FaShoppingCart, FaHeart, FaBoxOpen, FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useWishlist } from "../context/WishlistContext";
import { productCategory, searchProducts } from "../utils/productSearch";
import logo from "../assets/logo.png";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const { products } = useProducts();
    const { logout, user, role } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const searchBoxRef = useRef(null);
    const [search, setSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const displayName = user?.name?.trim() || user?.fullName?.trim() || user?.email?.split("@")[0] || "there";
    const canBrowse = role === "BUYER";
    const homePath = role === "ADMIN" ? "/admin" : role === "SELLER" ? "/seller" : role === "BUYER" ? "/" : "/login";
    const profilePath = role === "ADMIN" ? "/admin/profile" : role === "SELLER" ? "/seller/profile" : "/profile";
    const suggestions = useMemo(() => {
        const query = search.trim().toLowerCase();
        return searchProducts(products, query)
            .sort((a, b) => {
                const rank = (product) => {
                    const name = String(product.name || product.productName || "").toLowerCase();
                    const brand = String(product.brand || "").toLowerCase();
                    const category = productCategory(product).toLowerCase();
                    return name.startsWith(query) ? 0 : brand.startsWith(query) ? 1 : category.startsWith(query) ? 2 : 3;
                };
                return rank(a) - rank(b);
            }).slice(0, 6);
    }, [products, search]);

    useEffect(() => {
        const closeOnOutsideClick = (event) => {
            if (!searchBoxRef.current?.contains(event.target)) setShowSuggestions(false);
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeOnOutsideClick);
    }, []);

    const openSearchResults = (event) => {
        event.preventDefault();
        const term = search.trim();
        if (!term) return;
        setShowSuggestions(false);
        navigate("/search?q=" + encodeURIComponent(term));
    };
    const handleLogout = () => { logout(); navigate("/login"); };
    const searchHref = "/search?q=" + encodeURIComponent(search.trim());

    return <nav className="sticky top-0 z-50 w-full bg-[#111111] text-white shadow-lg"><div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6"><div className="flex min-h-20 flex-wrap items-center justify-between gap-3 py-3 2xl:flex-nowrap">
        <Link to={homePath} className="flex shrink-0 items-center gap-3"><img src={logo} alt="Cart24Seven" className="h-12 w-12 rounded-lg object-contain"/><div className="hidden sm:block"><h1 className="text-2xl font-extrabold text-[#FFD21F]">Cart24Seven</h1><p className="text-xs text-gray-300">Shop Anytime. Anywhere.</p></div></Link>
        {canBrowse && <form ref={searchBoxRef} onSubmit={openSearchResults} className="relative order-last flex w-full md:order-none md:max-w-xl md:flex-1 2xl:min-w-0 2xl:max-w-none"><div className="flex w-full overflow-hidden rounded-full bg-white ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-[#FFD21F]"><input type="search" value={search} onFocus={() => setShowSuggestions(true)} onChange={(event) => { setSearch(event.target.value); setShowSuggestions(true); }} onKeyDown={(event) => { if (event.key === "Escape") setShowSuggestions(false); }} placeholder="Search by product, brand, or category..." aria-label="Search by product name, brand, or category" aria-autocomplete="list" aria-expanded={showSuggestions && Boolean(search.trim())} className="min-w-0 flex-1 px-4 py-3 text-gray-800 outline-none sm:px-5"/><button type="submit" aria-label="See search results" className="bg-[#FFD21F] px-5 text-[#111111] transition hover:bg-[#E8B900]"><FaSearch size={18}/></button></div>
            {showSuggestions && search.trim() && <div role="listbox" className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
                {suggestions.length ? <><p className="px-4 pb-2 pt-3 text-xs font-bold uppercase tracking-wider text-slate-500">Products matching your search</p>{suggestions.map((product) => <button key={product.id} type="button" role="option" onClick={() => { setShowSuggestions(false); navigate("/product/" + product.id); }} className="flex w-full items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-left transition hover:bg-amber-50"><span className="min-w-0"><span className="block truncate font-semibold">{product.name || product.productName || "Product"}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{[product.brand, productCategory(product)].filter(Boolean).join(" · ")}</span></span><span className="shrink-0 text-sm font-bold text-[#6f5500]">₹{Number(product.price || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></button>)}</> : <p className="px-4 py-4 text-sm text-slate-600">No matching products found. Press Enter to view the no-results page.</p>}
                <Link to={searchHref} onClick={() => setShowSuggestions(false)} className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-[#6f5500] transition hover:bg-amber-50">See all results for “{search.trim()}”<span aria-hidden="true">→</span></Link>
            </div>}
        </form>}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 2xl:gap-2">
            {user && <span className="max-w-24 truncate whitespace-nowrap text-xs font-semibold text-white sm:max-w-32 sm:text-sm" title={`Hi, ${displayName}`} aria-label={`Hi, ${displayName}`}>Hi, <span className="text-[#FFD21F]">{displayName}</span></span>}
            {canBrowse && <><Link to="/" className="hidden font-semibold hover:text-[#FFD21F] lg:block">Home</Link><Link to="/categories" className="hidden font-semibold hover:text-[#FFD21F] lg:block">Categories</Link></>}
            {role==="ADMIN"&&<Link to="/admin" className="flex items-center gap-2 hover:text-[#FFD21F]"><LayoutDashboard size={18}/><span className="hidden xl:inline">Admin</span></Link>}
            {role==="SELLER"&&<Link to="/seller" className="flex items-center gap-2 hover:text-[#FFD21F]"><LayoutDashboard size={18}/><span className="hidden xl:inline">Seller</span></Link>}
            {user && <Link to={profilePath} className="flex items-center gap-1 whitespace-nowrap hover:text-[#FFD21F]" aria-label="Open my profile" title="My profile"><UserRound size={18}/><span className="hidden xl:inline">Profile</span></Link>}
            {canBrowse&&<>{user&&role==="BUYER"&&<Link to="/browsing-history" className="hidden items-center gap-1 hover:text-[#FFD21F] 2xl:flex"><Clock3 size={17}/>History</Link>}<Link to="/wishlist" className="relative flex items-center gap-2 hover:text-[#FFD21F]" aria-label={`Wishlist, ${wishlistCount} saved items`}><FaHeart/><span className="hidden 2xl:inline">Wishlist</span>{wishlistCount > 0 && <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">{wishlistCount}</span>}</Link><Link to="/cart" className="relative flex items-center gap-2 hover:text-[#FFD21F]"><FaShoppingCart/><span className="hidden 2xl:inline">Cart</span><span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFD21F] px-1 text-xs font-bold text-[#111111]">{cartCount}</span></Link>{user&&role==="BUYER"&&<Link to="/my-orders" className="hidden items-center gap-2 hover:text-[#FFD21F] md:flex"><FaBoxOpen/><span className="hidden 2xl:inline">My Orders</span></Link>}</>}
            <button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white transition hover:border-[#FFD21F] hover:text-[#FFD21F]">{theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</button>
            {user?<button type="button" onClick={handleLogout} className="shrink-0 rounded-lg bg-[#FFD21F] px-3 py-2 text-sm font-bold text-[#111111] sm:px-5 sm:text-base">Logout</button>:<Link to="/login" className="shrink-0 rounded-lg bg-[#FFD21F] px-3 py-2 text-sm font-bold text-[#111111] sm:px-5 sm:text-base">Login</Link>}
        </div>
    </div></div></nav>;
}
export default Navbar;


