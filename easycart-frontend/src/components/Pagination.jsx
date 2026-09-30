import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pageCount, onPageChange, total, pageSize }) {
    if (pageCount <= 1) return null;
    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);
    const start = Math.max(1, Math.min(page - 2, pageCount - 4));
    const pages = Array.from({ length: Math.min(pageCount, 5) }, (_, index) => start + index);
    return <nav aria-label="Product pages" className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row"><p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-800">{first}–{last}</span> of <span className="font-semibold text-slate-800">{total}</span> products</p><div className="flex items-center gap-1"><button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={18}/></button>{pages.map((number) => <button key={number} type="button" aria-current={page === number ? "page" : undefined} onClick={() => onPageChange(number)} className={`h-10 min-w-10 rounded-xl px-3 text-sm font-bold ${page === number ? "bg-[#111111] text-[#FFD21F]" : "border border-slate-200 text-slate-700 hover:bg-amber-50"}`}>{number}</button>)}<button type="button" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} aria-label="Next page" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={18}/></button></div></nav>;
}
