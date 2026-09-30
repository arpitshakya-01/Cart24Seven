import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, SearchX } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";
import { searchProducts } from "../utils/productSearch";
import ProductSkeletonGrid from "../components/ProductSkeletonGrid";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 12;

export default function SearchResults() {
    const { products, loading } = useProducts();
    const [params] = useSearchParams();
    const [page, setPage] = useState(1);
    const query = params.get("q")?.trim() || "";
    const results = searchProducts(products, query);
    const pageCount = Math.ceil(results.length / PAGE_SIZE);
    const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    useEffect(() => { setPage(1); }, [query, products.length]);

    return <main className="min-h-screen bg-[#f6f6f4] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-screen-2xl">
            <Link to="/" className="mb-6 inline-flex items-center gap-2 font-semibold text-slate-600 transition hover:text-[#806100]"><ArrowLeft size={18}/>Back to shopping</Link>
            <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div><p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#9b7600]"><Search size={16}/>Product search</p><h1 className="text-3xl font-extrabold text-[#111111] sm:text-4xl">{query ? `Results for “${query}”` : "Search products"}</h1><p className="mt-2 text-slate-600">Search across product names, brands, and categories.</p></div>
                {!loading && query && <span className="rounded-full border border-[#ead88b] bg-white px-4 py-2 text-sm font-bold text-[#5c4700]">{results.length} {results.length === 1 ? "result" : "results"}</span>}
            </header>
            {loading ? <ProductSkeletonGrid count={10} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"/> : results.length ? <><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{pageResults.map((product) => <ProductCard key={product.id} product={product}/>)}</div><Pagination page={page} pageCount={pageCount} total={results.length} pageSize={PAGE_SIZE} onPageChange={setPage}/></> : <section className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-[#9b7600]"><SearchX size={32}/></div><h2 className="mt-5 text-2xl font-extrabold text-[#111111]">{query ? "No products found" : "Enter a search term"}</h2><p className="mx-auto mt-2 max-w-lg text-slate-600">{query ? `We couldn’t find products matching “${query}”. Try a product name, brand, or category.` : "Use the search bar to look through our product names, brands, and categories."}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/categories" className="rounded-xl bg-[#FFD21F] px-5 py-3 font-bold text-[#111111] transition hover:bg-[#E8B900]">Browse categories</Link><Link to="/" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">View featured products</Link></div></section>}
        </div>
    </main>;
}
