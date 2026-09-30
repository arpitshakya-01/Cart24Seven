import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Filter, RotateCcw, Tag } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";
import { productCategory } from "../utils/productSearch";
import ProductSkeletonGrid from "../components/ProductSkeletonGrid";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 12;

const categoryData = [
    { name: "Electronics", description: "Phones, laptops, audio, and everyday tech.", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1800&auto=format&fit=crop&q=85" },
    { name: "Fashion", description: "Fresh styles, clothing, bags, and accessories.", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&auto=format&fit=crop&q=85" },
    { name: "Shoes", description: "Sneakers and everyday comfort for every plan.", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1800&auto=format&fit=crop&q=85" },
    { name: "Books", description: "Stories, study guides, and ideas worth keeping.", image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1800&auto=format&fit=crop&q=85" },
    { name: "Grocery", description: "Daily essentials and pantry favorites.", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1800&auto=format&fit=crop&q=85" },
    { name: "Accessories", description: "Useful finishing touches for work and life.", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1800&auto=format&fit=crop&q=85" },
];

export default function Categories() {
    const { products, loading } = useProducts();
    const [params, setParams] = useSearchParams();
    const selectedCategory = params.get("category") || "";
    const [selectedBrand, setSelectedBrand] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sort, setSort] = useState("featured");
    const [page, setPage] = useState(1);
    const activeCategory = categoryData.find((category) => category.name.toLowerCase() === selectedCategory.toLowerCase());
    const banner = activeCategory || categoryData[0];
    const categoryCount = (name) => products.filter((product) => productCategory(product).toLowerCase() === name.toLowerCase()).length;
    const brands = useMemo(() => [...new Set(products.map((product) => product.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [products]);

    const filteredProducts = useMemo(() => {
        let result = products.filter((product) => {
            const categoryMatch = !selectedCategory || productCategory(product).toLowerCase() === selectedCategory.toLowerCase();
            const brandMatch = !selectedBrand || String(product.brand || "").toLowerCase() === selectedBrand.toLowerCase();
            const price = Number(product.price || 0);
            const minMatch = minPrice === "" || price >= Number(minPrice);
            const maxMatch = maxPrice === "" || price <= Number(maxPrice);
            const stockMatch = !inStockOnly || Number(product.stock || 0) > 0;
            return categoryMatch && brandMatch && minMatch && maxMatch && stockMatch;
        });
        if (sort === "price-low") result = [...result].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        if (sort === "price-high") result = [...result].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        if (sort === "name") result = [...result].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        return result;
    }, [products, selectedCategory, selectedBrand, minPrice, maxPrice, inStockOnly, sort]);
    const pageCount = Math.ceil(filteredProducts.length / PAGE_SIZE);
    const pageProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    useEffect(() => { setPage(1); }, [selectedCategory, selectedBrand, minPrice, maxPrice, inStockOnly, sort, products.length]);

    const chooseCategory = (name) => {
        const next = new URLSearchParams(params);
        if (name) next.set("category", name); else next.delete("category");
        setParams(next);
    };
    const clearFilters = () => {
        chooseCategory(""); setSelectedBrand(""); setMinPrice(""); setMaxPrice(""); setInStockOnly(false); setSort("featured");
    };

    return <main className="min-h-screen bg-[#f6f6f4] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-screen-2xl">
            <section className="relative isolate mb-7 flex min-h-[250px] items-end overflow-hidden rounded-3xl bg-slate-900 p-6 shadow-xl sm:min-h-[300px] sm:p-10">
                <img src={banner.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} className="absolute inset-0 -z-20 h-full w-full object-cover"/>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b0b0b]/85 via-[#111111]/55 to-transparent"/>
                <div className="max-w-2xl text-white"><p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#FFD21F]">{activeCategory ? "Explore department" : "Cart24Seven departments"}</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{activeCategory ? activeCategory.name : "Shop by category"}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-lg sm:leading-7">{activeCategory ? activeCategory.description : "Browse a department, then narrow the products to find the right fit."}</p><p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur"><Tag size={16} className="text-[#FFD21F]"/>{selectedCategory ? `${categoryCount(selectedCategory)} products` : `${products.length} products across ${categoryData.length} categories`}</p></div>
            </section>

            <nav aria-label="Product categories" className="mb-7 flex gap-2 overflow-x-auto pb-2">{categoryData.map((category) => <button key={category.name} type="button" onClick={() => chooseCategory(selectedCategory === category.name ? "" : category.name)} aria-pressed={selectedCategory === category.name} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${selectedCategory === category.name ? "border-[#111111] bg-[#111111] text-[#FFD21F]" : "border-slate-300 bg-white text-slate-700 hover:border-[#d6a900] hover:bg-amber-50"}`}>{category.name}<span className="ml-2 opacity-70">{categoryCount(category.name)}</span></button>)}</nav>

            <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-8">
                <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28"><div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111111]"><Filter size={19} className="text-[#a78000]"/>Filters</h2><button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#806100]"><RotateCcw size={14}/>Clear</button></div>
                    <section className="border-t border-slate-100 py-4"><h3 className="mb-3 text-sm font-bold text-slate-800">Category</h3><div className="space-y-1">{categoryData.map((category) => <button key={category.name} type="button" onClick={() => chooseCategory(selectedCategory === category.name ? "" : category.name)} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${selectedCategory === category.name ? "bg-[#fff5c2] font-bold text-[#5c4700]" : "text-slate-600 hover:bg-slate-50"}`}><span>{category.name}</span><span className="flex items-center gap-1 text-xs text-slate-400">{categoryCount(category.name)}{selectedCategory === category.name && <Check size={14} className="text-[#806100]"/>}</span></button>)}</div></section>
                    <section className="border-t border-slate-100 py-4"><label htmlFor="brand-filter" className="mb-3 block text-sm font-bold text-slate-800">Brand</label><div className="relative"><select id="brand-filter" value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]"><option value="">All brands</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-slate-500"/></div></section>
                    <section className="border-t border-slate-100 py-4"><h3 className="mb-3 text-sm font-bold text-slate-800">Price range</h3><div className="grid grid-cols-2 gap-2"><label className="text-xs text-slate-500">Min price<input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="₹0" className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]"/></label><label className="text-xs text-slate-500">Max price<input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="No limit" className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]"/></label></div></section>
                    <label className="flex cursor-pointer items-center gap-2 border-t border-slate-100 py-4 text-sm font-semibold text-slate-700"><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} className="h-4 w-4 accent-[#b38a00]"/>In-stock products only</label>
                </aside>

                <section className="min-w-0"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-extrabold text-[#111111]">{activeCategory ? `${activeCategory.name} products` : "All products"}</h2><p className="mt-1 text-sm text-slate-600">{filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"} match your filters</p></div><label className="text-sm font-semibold text-slate-600">Sort by<select value={sort} onChange={(event) => setSort(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select></label></div>
                    {loading ? <ProductSkeletonGrid count={8} columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"/> : filteredProducts.length ? <><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{pageProducts.map((product) => <ProductCard key={product.id} product={product}/>)}</div><Pagination page={page} pageCount={pageCount} total={filteredProducts.length} pageSize={PAGE_SIZE} onPageChange={setPage}/></> : <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm"><h3 className="text-xl font-extrabold text-[#111111]">No products match these filters</h3><p className="mt-2 text-slate-600">Try a different category, brand, or price range.</p><button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-[#FFD21F] px-5 py-3 font-bold text-[#111111] transition hover:bg-[#E8B900]">Clear all filters</button></div>}
                </section>
            </div>
        </div>
    </main>;
}
