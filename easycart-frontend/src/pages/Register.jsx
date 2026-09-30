import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound, ShoppingBag } from "lucide-react";
import { registerUser } from "../services/authService";

export default function Register() {
    const navigate=useNavigate();
    const [formData,setFormData]=useState({name:"",email:"",password:""});
    const [loading,setLoading]=useState(false);
    const [message,setMessage]=useState("");
    const [error,setError]=useState("");
    const handleSubmit=async event=>{
        event.preventDefault();setLoading(true);setError("");setMessage("");
        try {
            await registerUser(formData);
            setMessage("Your buyer account is ready. Please sign in.");
            setTimeout(()=>navigate("/login"),1200);
        } catch(err) {
            setError(err.response?.data?.detail||err.response?.data?.message||(err.response?"Registration failed. Check your details and try again.":"Cannot reach the authentication server. Start MySQL and the backend, then try again."));
        } finally {setLoading(false);}
    };
    return <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#fff9df] px-4 py-10"><section className="w-full max-w-md overflow-hidden rounded-3xl border border-[#f0d35a] bg-white shadow-2xl">
        <header className="bg-[#111111] px-8 py-7 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFD21F] text-[#111111]"><ShoppingBag size={24}/></div><h1 className="text-3xl font-extrabold text-[#FFD21F]">Create Buyer Account</h1><p className="mt-2 text-gray-200">Join Cart24Seven and shop anytime.</p></header>
        <div className="p-8">{message&&<p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-green-800">{message}</p>}{error&&<p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block font-semibold text-[#111111]">Full name<div className="mt-2 flex items-center rounded-xl border border-gray-300 px-3 focus-within:border-[#d6a900] focus-within:ring-2 focus-within:ring-[#FFD21F]"><UserRound className="text-gray-400" size={19}/><input autoComplete="name" type="text" name="name" placeholder="Your name" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className="w-full border-0 p-3 outline-none" required/></div></label>
                <label className="block font-semibold text-[#111111]">Email address<input autoComplete="email" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required/></label>
                <label className="block font-semibold text-[#111111]">Password<input autoComplete="new-password" type="password" name="password" placeholder="At least 8 characters" minLength={8} value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required/></label>
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#FFD21F] py-3 font-bold text-[#111111] transition hover:bg-[#E8B900] disabled:opacity-50">{loading?"Creating account…":"Create account"}</button>
            </form>
            <p className="mt-6 text-center text-gray-600">Already have an account? <Link to="/login" className="font-semibold text-[#6f5500] underline">Sign in</Link></p>
        </div>
    </section></main>;
}


