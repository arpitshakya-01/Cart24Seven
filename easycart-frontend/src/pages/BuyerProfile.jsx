import { useEffect, useState } from "react";
import { UserRound, Save, Truck, ShieldCheck } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialProfile={name:"",email:"",phone:"",addressLine:"",city:"",state:"",pincode:"",paymentPreference:"COD"};
const inputClass="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#d6a900] focus:ring-2 focus:ring-[#ffd21f]/40";
export default function BuyerProfile() {
    const {updateUser}=useAuth();
    const [profile,setProfile]=useState(initialProfile);
    const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");
    useEffect(()=>{let active=true;api.get("/buyer/profile").then(r=>{if(active)setProfile({...initialProfile,...r.data});}).catch(e=>{if(active)setError(e.response?.data?.message||"Profile could not be loaded.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
    const change=e=>setProfile(current=>({...current,[e.target.name]:e.target.value}));
    const save=async e=>{e.preventDefault();setSaving(true);setMessage("");setError("");try{const data=(await api.put("/buyer/profile",profile)).data;setProfile(current=>({...current,...data}));updateUser(data);setMessage("Profile and delivery details saved.");}catch(err){setError(err.response?.data?.message||"Could not save your profile.");}finally{setSaving(false);}};
    if(loading)return <main className="min-h-screen bg-[#f6f6f4] px-4 py-10"><div className="mx-auto max-w-4xl animate-pulse rounded-3xl bg-white p-8"><div className="h-8 w-48 rounded bg-slate-200"/><div className="mt-8 h-12 rounded bg-slate-100"/><div className="mt-4 h-12 rounded bg-slate-100"/></div></main>;
    return <main className="min-h-screen bg-[#f6f6f4] px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="h-2 bg-[#ffd21f]"/><form onSubmit={save} className="space-y-7 p-5 sm:p-9 lg:p-11">
            <header className="flex items-center gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff7d1] text-[#725700]"><UserRound size={29}/></div><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#806100]">Your account</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#111111]">My Profile</h1><p className="mt-1 text-sm text-slate-600">Manage your contact and delivery details.</p></div></header>
            {message&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-medium text-emerald-800">{message}</p>}{error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-medium text-rose-800">{error}</p>}
            <section><h2 className="mb-4 border-b border-slate-100 pb-2 text-sm font-extrabold uppercase tracking-wider text-slate-500">Contact information</h2><div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-800">Full name<input name="name" value={profile.name} onChange={change} autoComplete="name" required className={inputClass}/></label>
                <label className="block text-sm font-bold text-slate-800">Email address<input value={profile.email} readOnly className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`}/><span className="mt-1 block text-xs font-normal text-slate-500">Your account email can’t be changed here.</span></label>
                <label className="block text-sm font-bold text-slate-800 sm:col-span-2">Phone<input name="phone" value={profile.phone} onChange={change} autoComplete="tel" inputMode="tel" className={inputClass} placeholder="Add a contact number"/></label>
            </div></section>
            <section><h2 className="mb-4 border-b border-slate-100 pb-2 text-sm font-extrabold uppercase tracking-wider text-slate-500">Delivery address</h2><div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-bold text-slate-800 sm:col-span-3">Street address<textarea name="addressLine" value={profile.addressLine} onChange={change} autoComplete="street-address" rows="3" className={inputClass} placeholder="House number, street, area"/></label>
                <label className="block text-sm font-bold text-slate-800">City<input name="city" value={profile.city} onChange={change} autoComplete="address-level2" className={inputClass}/></label>
                <label className="block text-sm font-bold text-slate-800">State<input name="state" value={profile.state} onChange={change} autoComplete="address-level1" className={inputClass}/></label>
                <label className="block text-sm font-bold text-slate-800">PIN code<input name="pincode" value={profile.pincode} onChange={change} autoComplete="postal-code" inputMode="numeric" className={inputClass}/></label>
            </div></section>
            <section className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-slate-800">Preferred payment method<select name="paymentPreference" value={profile.paymentPreference||"COD"} onChange={change} className={inputClass}><option value="COD">Cash on delivery</option><option value="ONLINE">Online payment preference</option></select><span className="mt-1 block text-xs font-normal text-slate-500">Online payments are available only when configured for this store.</span></label><div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-[#fffbea] p-4"><Truck size={21} className="mt-0.5 shrink-0 text-[#806100]"/><div><p className="font-bold text-slate-900">Delivery charges</p><p className="mt-1 text-sm leading-5 text-slate-700">₹40 delivery fee on orders below ₹499. Orders of ₹499 or more ship free.</p></div></div></section>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5"><p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={16} className="text-emerald-700"/>Your account information is kept private.</p><button disabled={saving} className="rounded-xl bg-[#ffd21f] px-6 py-3 font-extrabold text-[#111111] shadow-sm transition hover:bg-[#e8b900] focus:outline-none focus:ring-2 focus:ring-[#d6a900] focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"><Save className="mr-2 inline" size={18}/>{saving?"Saving…":"Save profile"}</button></div>
        </form></div></main>;
}
