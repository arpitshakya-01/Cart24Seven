import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function AdminProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(user || {});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/admin/users")
            .then(({ data }) => {
                const savedProfile = data.find((account) =>
                    (account.email || "").toLowerCase() === (user?.email || "").toLowerCase()
                );
                if (active && savedProfile) setProfile(savedProfile);
                else if (active) setError("Your saved admin account details could not be found.");
            })
            .catch((requestError) => {
                if (active) setError(requestError.response?.data?.message || "Could not load saved profile details.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [user?.email]);

    return <main className="min-h-screen bg-[#f6f6f4] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl">
            <Link to="/admin" className="mb-6 inline-flex items-center gap-2 font-semibold text-slate-700 transition hover:text-[#9b7600]"><ArrowLeft size={18}/>Back to dashboard</Link>
            <section className="overflow-hidden rounded-3xl border border-[#eee1a6] bg-white shadow-lg">
                <header className="bg-[#111111] px-7 py-8 text-white sm:px-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFD21F] text-[#111111]"><UserRound size={30}/></div>
                    <h1 className="mt-4 text-3xl font-extrabold">Admin Profile Details</h1>
                    <p className="mt-1 text-slate-300">Account information saved in the platform.</p>
                </header>
                <div className="space-y-4 p-7 sm:p-10">
                    {loading && <p className="text-slate-600">Loading profile details…</p>}
                    {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-900">{error}</p>}
                    <div className="rounded-2xl border border-slate-200 bg-[#faf9f4] p-5">
                        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Full name</p>
                        <p className="flex items-center gap-2 text-lg font-bold text-slate-900"><UserRound size={18} className="text-[#a78000]"/>{profile.name || "Name not available"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-[#faf9f4] p-5">
                        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Email address</p>
                        <p className="flex items-center gap-2 break-all text-lg font-bold text-slate-900"><Mail size={18} className="text-[#a78000]"/>{profile.email || "Email not available"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-[#faf9f4] p-5">
                        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Account role</p>
                        <p className="flex items-center gap-2 text-lg font-bold text-slate-900"><ShieldCheck size={18} className="text-[#a78000]"/>{(profile.role || "ADMIN").toString().toUpperCase()}</p>
                    </div>
                    <p className="text-sm text-slate-500">These details are read from your saved admin account.</p>
                </div>
            </section>
        </div>
    </main>;
}
