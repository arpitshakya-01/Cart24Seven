import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SellerProfile() {
    const { user, role } = useAuth();

    return <main className="min-h-screen bg-[#f6f6f4] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl">
            <Link to="/seller" className="mb-6 inline-flex items-center gap-2 font-semibold text-slate-700 transition hover:text-[#9b7600]"><ArrowLeft size={18}/>Back to seller dashboard</Link>
            <section className="overflow-hidden rounded-3xl border border-[#eee1a6] bg-white shadow-lg">
                <header className="bg-[#111111] px-7 py-8 text-white sm:px-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFD21F] text-[#111111]"><UserRound size={30}/></div>
                    <h1 className="mt-4 text-3xl font-extrabold">Seller Profile</h1>
                    <p className="mt-1 text-slate-300">Your signed-in account details.</p>
                </header>
                <div className="space-y-4 p-7 sm:p-10">
                    <div className="rounded-2xl border border-slate-200 bg-[#faf9f4] p-5">
                        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Full name</p>
                        <p className="flex items-center gap-2 text-lg font-bold text-slate-900"><UserRound size={18} className="text-[#a78000]"/>{user?.name || user?.fullName || "Name not available"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-[#faf9f4] p-5">
                        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Email address</p>
                        <p className="flex items-center gap-2 break-all text-lg font-bold text-slate-900"><Mail size={18} className="text-[#a78000]"/>{user?.email || "Email not available"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-[#faf9f4] p-5">
                        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Account role</p>
                        <p className="flex items-center gap-2 text-lg font-bold text-slate-900"><ShieldCheck size={18} className="text-[#a78000]"/>{role || "SELLER"}</p>
                    </div>
                </div>
            </section>
        </div>
    </main>;
}
