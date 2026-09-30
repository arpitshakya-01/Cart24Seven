import { Star } from "lucide-react";

export default function RatingStars({ rating, size = 14 }) {
    const value = Math.min(5, Math.max(0, Number(rating) || 0));
    if (!value) return <span className="text-xs text-slate-400">No ratings yet</span>;
    return <span role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`} className="inline-flex items-center gap-1"><span className="inline-flex items-center" aria-hidden="true">{[1,2,3,4,5].map((star) => { const fill = Math.max(0, Math.min(1, value - star + 1)) * 100; return <span key={star} className="relative inline-flex" style={{ width: size, height: size }}><Star size={size} className="absolute inset-0 text-amber-400"/><span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill}%` }}><Star size={size} className="max-w-none fill-amber-400 text-amber-500"/></span></span>; })}</span><span className="text-sm font-bold text-slate-700">{value.toFixed(1)}</span><span className="text-xs text-slate-400">/ 5</span></span>;
}
