import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, MailCheck } from "lucide-react";
import { verifyEmail } from "../services/authService";

export default function VerifyEmail() {
    const [params] = useSearchParams();
    const token = params.get("token") || "";
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        let active = true;
        if (!token) { setStatus("invalid"); return () => { active = false; }; }
        verifyEmail(token).then((result) => {
            if (active) setStatus(result.verified ? "verified" : "invalid");
        }).catch(() => { if (active) setStatus("error"); });
        return () => { active = false; };
    }, [token]);

    const message = {
        loading: "Verifying your email…",
        verified: "Your email is verified. You can now sign in to Cart24Seven.",
        invalid: "This verification link is invalid or has expired. Return to registration and request another link.",
        error: "We could not verify this link right now. Please try again.",
    }[status];

    return <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#fff9df] px-4 py-10">
        <section className="w-full max-w-lg rounded-3xl border border-[#f0d35a] bg-white p-8 text-center shadow-2xl sm:p-10">
            {status === "verified" ? <CheckCircle2 size={48} className="mx-auto text-emerald-600"/> : <MailCheck size={48} className="mx-auto text-[#9b7600]"/>}
            <h1 className="mt-5 text-2xl font-extrabold text-slate-900">{status === "verified" ? "Email verified" : "Email verification"}</h1>
            <p role="status" className="mt-3 text-slate-600">{message}</p>
            {status !== "loading" && <Link to="/login" className="mt-6 inline-flex rounded-xl bg-[#FFD21F] px-6 py-3 font-bold text-[#111111] hover:bg-[#E8B900]">Go to sign in</Link>}
        </section>
    </main>;
}
