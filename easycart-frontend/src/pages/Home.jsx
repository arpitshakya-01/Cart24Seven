import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";
import { productCategory, searchProducts } from "../utils/productSearch";
import ProductSkeletonGrid from "../components/ProductSkeletonGrid";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 12;

function Home() {
    const { products, loading } = useProducts();
    const [page, setPage] = useState(1);
    const [searchParams] = useSearchParams();
    const searchTerm = searchParams.get("search")?.trim() || "";
    const selectedCategory = searchParams.get("category")?.trim() || "";
    const visibleProducts = useMemo(() => {
        const matching = searchTerm ? searchProducts(products, searchTerm) : products;
        return selectedCategory ? matching.filter((product) => productCategory(product).toLowerCase() === selectedCategory.toLowerCase()) : matching;
    }, [products, searchTerm, selectedCategory]);
    const title = searchTerm ? `Results for “${searchTerm}”` : selectedCategory || "Featured Products";
    const pageCount = Math.ceil(visibleProducts.length / PAGE_SIZE);
    const pageProducts = visibleProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    useEffect(() => { setPage(1); }, [searchTerm, selectedCategory, products.length]);

    return <main className="min-h-screen bg-[#f6f6f4] px-3 pb-12 pt-8 sm:px-6 lg:px-8"><div className="mx-auto w-full max-w-screen-2xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8"><div><p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#9b7600]">Picked for you</p><h1 className="text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">{title}</h1><p className="mt-2 text-slate-600">Find something you’ll love, with great value every day.</p></div><div className="flex items-center gap-3"><span className="rounded-full border border-[#ead88b] bg-white px-4 py-2 text-sm font-bold text-[#5c4700] shadow-sm">{visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}</span>{selectedCategory && <Link to="/categories" className="text-sm font-semibold text-slate-600 underline decoration-[#d6a900] underline-offset-4">All categories</Link>}</div></header>
        {loading ? <ProductSkeletonGrid count={10} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"/> : visibleProducts.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-14"><h2 className="text-2xl font-bold text-[#111111]">{searchTerm ? "No matching products" : "No products in this category yet"}</h2><p className="mt-2 text-slate-500">{searchTerm ? "Try another search term." : "Check back soon for new listings."}</p><Link to={searchTerm ? "/search?q=" + encodeURIComponent(searchTerm) : "/categories"} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FFD21F] px-5 py-3 font-bold text-[#111111] transition hover:bg-[#E8B900]">{searchTerm ? "View search results" : "Browse categories"}<ArrowRight size={18}/></Link></div> : <><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{pageProducts.map((product) => <ProductCard key={product.id} product={product}/>)}</div><Pagination page={page} pageCount={pageCount} total={visibleProducts.length} pageSize={PAGE_SIZE} onPageChange={setPage}/></>}
    </div></main>;
}
export default Home;
