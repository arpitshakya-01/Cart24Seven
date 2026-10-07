import { useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { resolveProductImage } from "../services/resolveProductImage";

export default function ProductMediaSlider({ media = [], image, name, className = "" }) {
  const items = media?.length ? media : image ? [{ url: image, type: "IMAGE" }] : [];
  const [index,setIndex] = useState(0);
  const current=items[Math.min(index,Math.max(0,items.length-1))];
  const move=(delta,event)=>{event.preventDefault();event.stopPropagation();setIndex((n)=>(n+delta+items.length)%items.length);};
  return <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-[#faf9f4] to-slate-100 ${className}`}>
    {current?.type === "VIDEO" ? <video key={current.url} src={resolveProductImage(current.url)} controls playsInline className="h-full w-full object-contain" aria-label={`${name} product video`}/> : <img src={resolveProductImage(current?.url) || "https://placehold.co/600x600?text=Cart24Seven"} alt={name || "Product"} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" onError={(event)=>{event.currentTarget.src="https://placehold.co/600x600?text=Cart24Seven";}}/>}
    {items.length>1 && <><button type="button" aria-label="Previous product media" onClick={(event)=>move(-1,event)} className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow"><ChevronLeft size={18}/></button><button type="button" aria-label="Next product media" onClick={(event)=>move(1,event)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow"><ChevronRight size={18}/></button><div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2 py-1">{items.map((item,i)=><button type="button" key={`${item.url}-${i}`} onClick={(event)=>{event.preventDefault();event.stopPropagation();setIndex(i);}} aria-label={`Show media ${i+1}`} className={`h-1.5 w-1.5 rounded-full ${i===index?"bg-white":"bg-white/50"}`}/>)}</div></>}
    {current?.type === "VIDEO" && <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 p-2 text-white"><Play size={14} fill="currentColor"/></span>}
  </div>;
}
