import { Link } from "react-router-dom";
import { Clock3, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
export default function BrowsingHistory() {
    const {products}=useProducts();const {user}=useAuth();const key="cart24BrowsingHistory:"+(user?.email||"guest");
    const [ids,setIds]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)||"[]");}catch{return [];}});
    useEffect(()=>{try{setIds(JSON.parse(localStorage.getItem(key)||"[]"));}catch{setIds([]);}},[key]);
    const history=ids.map(id=>products.find(p=>String(p.id)===String(id))).filter(Boolean);
    const clear=()=>{localStorage.removeItem(key);setIds([]);};
    return <main className="min-h-screen bg-slate-100 px-5 py-8"><div className="mx-auto max-w-screen-2xl"><div className="mb-6 flex items-center justify-between"><h1 className="flex items-center gap-3 text-3xl font-bold"><Clock3/>Browsing History</h1><button onClick={clear} className="rounded-lg border bg-white px-4 py-2"><Trash2 className="mr-2 inline" size={17}/>Clear history</button></div>{history.length?<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{history.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="rounded-2xl bg-white p-10 text-center text-gray-600">Products you view will appear here. <Link to="/" className="text-green-700 underline">Browse products</Link></div>}</div></main>;
}
