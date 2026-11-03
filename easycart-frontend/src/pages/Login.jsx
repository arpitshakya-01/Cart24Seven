import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resendVerificationEmail } from "../services/authService";

function Login() {
    const location=useLocation();
    const adminPortal=location.pathname.startsWith("/admin/");
    const navigate=useNavigate();
    const {login,logout}=useAuth();
    const [formData,setFormData]=useState({email:"",password:""});
    const [loading,setLoading]=useState(false);
    const [error,setError]=useState(location.search.includes("error=role")?"This account is not an administrator. Sign in with an admin account.":"");
    const [verificationNeeded,setVerificationNeeded]=useState(false);
    const [resendMessage,setResendMessage]=useState("");
    const [resending,setResending]=useState(false);
    const handleSubmit=async event=>{
        event.preventDefault();setLoading(true);setError("");setVerificationNeeded(false);setResendMessage("");
        try {
            const user=await login(formData);
            const role=(user.role||"BUYER").toUpperCase();
            if(adminPortal&&role!=="ADMIN"){logout();setError("This account does not have administrator access. Ask an admin to assign the ADMIN role.");return;}
            navigate(role==="ADMIN"?"/admin":role==="SELLER"?"/seller":"/",{replace:true});
        } catch(err) {
            const serverMessage=err.response?.data?.detail||err.response?.data?.message||"";
            setVerificationNeeded(err.response?.status===403&&serverMessage.toLowerCase().includes("verify your email"));
            setError(err.response?.data?.detail||err.response?.data?.message||err.response?.data?.error||(err.response?"Invalid email or password.":"Cannot reach the authentication server. Start MySQL and the backend, then try again."));
        } finally {setLoading(false);}
    };
    const resendVerification=async()=>{
        setResending(true);setResendMessage("");
        try { await resendVerificationEmail(formData.email); setResendMessage("If this account needs verification, a new link will arrive shortly."); }
        catch(err) { setResendMessage(err.response?.data?.detail||err.response?.data?.message||"Could not send the link. Please try again later."); }
        finally { setResending(false); }
    };
    return <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#fff9df] px-4 py-10"><section className="w-full max-w-md overflow-hidden rounded-3xl border border-[#f0d35a] bg-white shadow-2xl">
        <header className="bg-[#111111] px-8 py-7 text-center"><h1 className="text-4xl font-extrabold text-[#FFD21F]">Cart24Seven</h1><p className="mt-2 text-gray-200">{adminPortal?"Administrator Portal":"Sign in to your account"}</p></header>
        <div className="p-8 sm:p-10">{error&&<div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}{verificationNeeded&&<button type="button" onClick={resendVerification} disabled={resending||!formData.email} className="mb-4 w-full rounded-xl border border-[#d6a900] py-3 font-semibold text-[#6f5500] disabled:opacity-50">{resending?"Sending…":"Resend verification email"}</button>}{resendMessage&&<p role="status" className="mb-4 text-center text-sm text-slate-600">{resendMessage}</p>}
            <form onSubmit={handleSubmit} className="space-y-5"><label className="block font-semibold text-[#111111]">Email address<input type="email" name="email" autoComplete="username" placeholder="you@example.com" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required/></label>
                <label className="block font-semibold text-[#111111]">Password<input type="password" name="password" autoComplete="current-password" placeholder="Password" value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required/></label>
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#FFD21F] py-3 font-bold text-[#111111] transition hover:bg-[#E8B900] disabled:opacity-50">{loading?"Signing in…":adminPortal?"Sign in to Admin":"Login"}</button>
            </form>
            <div className="mt-6 space-y-3 text-center"><p className="text-gray-600">Need a buyer account? <Link to="/register" className="font-semibold text-[#6f5500] underline">Register</Link></p>{!adminPortal&&<Link to="/admin/login" className="inline-block font-semibold text-[#6f5500] underline">Admin portal sign in</Link>}{adminPortal&&<Link to="/login" className="inline-block font-semibold text-[#6f5500] underline">Buyer sign in</Link>}</div>
        </div></section></main>;
}
export default Login;


