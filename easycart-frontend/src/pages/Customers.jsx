import { useEffect, useState } from "react";
import { UserRound, Search, UserPlus, Trash2, Pencil, ShieldCheck } from "lucide-react";
import api from "../services/api";

const roleValue = (role) => (role || "BUYER").toUpperCase() === "USER" ? "BUYER" : (role || "BUYER").toUpperCase();

export default function Customers() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [primaryAdminConfigured, setPrimaryAdminConfigured] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "BUYER" });

    const load = async () => {
        try {
            const { data } = await api.get("/admin/users");
            setUsers(data);
            setPrimaryAdminConfigured(data.some((account) => account.primaryAdminEmailConfigured));
            setError("");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not load users.");
        }
    };
    useEffect(() => { load(); }, []);

    const add = async (event) => {
        event.preventDefault();
        try {
            await api.post("/admin/users", form);
            setForm({ name: "", email: "", password: "", role: "BUYER" });
            load();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not create user.");
        }
    };

    const edit = async (account) => {
        if (account.protectedAdmin) return;
        const name = window.prompt("Update name", account.name);
        if (name === null) return;
        const email = window.prompt("Update email", account.email);
        if (email === null) return;
        try {
            await api.put(`/admin/users/${account.id}`, { name, email });
            load();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not update user.");
        }
    };

    const setRole = async (account, role) => {
        if (account.protectedAdmin) return;
        try {
            await api.put(`/admin/users/${account.id}`, { role });
            load();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not change role.");
        }
    };

    const setGstinStatus = async (account, gstinStatus) => {
        if (account.protectedAdmin) return;
        try {
            await api.put(`/admin/users/${account.id}`, { gstinStatus });
            load();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not update GSTIN review status.");
        }
    };

    const remove = async (account) => {
        if (account.protectedAdmin) return;
        if (!window.confirm(`Delete account for ${account.email}?`)) return;
        try {
            await api.delete(`/admin/users/${account.id}`);
            load();
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not delete user.");
        }
    };

    const visible = users.filter((account) =>
        `${account.name} ${account.email} ${account.role}`.toLowerCase().includes(search.toLowerCase())
    );

    return <main className="min-h-screen bg-[#f6f6f4] px-5 py-8">
        <div className="mx-auto max-w-7xl">
            <div className="mb-7 flex items-center gap-3">
                <UserRound size={38} className="text-[#b38a00]" />
                <div>
                    <h1 className="text-3xl font-bold text-[#b38a00]">Users and Roles</h1>
                    <p className="text-gray-600">Create accounts, edit details, and assign platform access.</p>
                </div>
            </div>
            {error && <p role="alert" className="mb-5 rounded-xl bg-red-100 p-3 text-red-700">{error}</p>}
            {primaryAdminConfigured === true && <p className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                The Render-managed primary admin is protected. Other admins cannot edit its details, change its role, or delete it. Manage its name, email, and password through the Render backend environment settings.
            </p>}
            {primaryAdminConfigured === false && <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                CART24SEVEN_ADMIN_EMAIL is not configured. As a safeguard, all existing ADMIN accounts are protected from editing and deletion until a primary admin email is configured in Render.
            </p>}

            <form onSubmit={add} className="mb-7 grid gap-3 rounded-2xl bg-white p-5 shadow sm:grid-cols-2 lg:grid-cols-5">
                <input aria-label="Name" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-lg border border-slate-300 p-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required />
                <input aria-label="Email" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-lg border border-slate-300 p-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required />
                <input aria-label="Temporary password" type="password" minLength="8" placeholder="Temporary password (8+ chars)" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="rounded-lg border border-slate-300 p-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]" required />
                <select aria-label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="rounded-lg border border-slate-300 p-3 outline-none focus:border-[#d6a900] focus:ring-2 focus:ring-[#FFD21F]">
                    <option value="BUYER">Buyer</option><option value="SELLER">Seller</option><option value="ADMIN">Admin</option>
                </select>
                <button className="rounded-lg bg-[#FFD21F] p-3 font-bold text-[#111111] transition hover:bg-[#E8B900]"><UserPlus className="mr-1 inline" size={18} />Create account</button>
            </form>

            <div className="mb-4 flex items-center gap-2 rounded-xl bg-white p-3 shadow">
                <Search className="text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or role" className="w-full outline-none" />
            </div>
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Seller GSTIN and HSN review here is a manual admin record; the site is not connected to GSTN and cannot independently verify registrations.</p>

            <div className="overflow-x-auto rounded-2xl bg-white shadow">
                <table className="w-full text-left">
                    <thead className="bg-[#111111] text-[#FFD21F]"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">GSTIN / business state</th><th className="p-4">GSTIN review</th><th className="p-4">Actions</th></tr></thead>
                    <tbody>{visible.map((account) => <tr key={account.id} className="border-b border-slate-200 transition hover:bg-amber-50/70">
                        <td className="p-4">{account.name}</td>
                        <td className="p-4">{account.email}</td>
                        <td className="p-4">
                            <select aria-label={`Role for ${account.email}`} disabled={account.protectedAdmin} title={account.protectedAdmin ? "Managed by the Render primary admin settings" : "Change user role"} value={roleValue(account.role)} onChange={(event) => setRole(account, event.target.value)} className="rounded-lg border border-[#d6a900] bg-amber-50 p-2 font-semibold text-slate-800 focus:ring-2 focus:ring-[#FFD21F] disabled:cursor-not-allowed disabled:opacity-60">
                                {["BUYER", "SELLER", "ADMIN"].map((role) => <option key={role} value={role}>{role}</option>)}
                            </select>
                            {account.primaryAdmin && <span className="mt-1 block text-xs font-semibold text-blue-800">Render primary admin</span>}
                        </td>
                        <td className="p-4 text-sm">{roleValue(account.role) === "SELLER" ? <><div>{account.gstin || "Not submitted"}</div><div className="text-xs text-slate-500">{account.state || "Business state not set"}</div></> : "-"}</td>
                        <td className="p-4">{roleValue(account.role) === "SELLER" ? <select aria-label={`GSTIN review for ${account.email}`} disabled={account.protectedAdmin} value={account.gstinStatus || "NOT_SUBMITTED"} onChange={(event) => setGstinStatus(account, event.target.value)} className="rounded-lg border p-2 text-sm disabled:opacity-60">{["NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select> : "-"}</td>
                        <td className="p-4">{account.protectedAdmin ? <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-2 text-xs font-semibold text-blue-900"><ShieldCheck size={16} />{account.primaryAdmin ? "Protected primary admin" : "Protected admin account"}</span> : <div className="flex gap-2">
                            <button onClick={() => edit(account)} title="Edit user" className="rounded-lg bg-[#FFD21F] p-2 text-[#111111] transition hover:bg-[#E8B900]"><Pencil size={18} /></button>
                            <button onClick={() => remove(account)} title="Delete user" className="rounded-lg bg-red-600 p-2 text-white"><Trash2 size={18} /></button>
                        </div>}</td>
                    </tr>)}
                    {!visible.length && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No matching users.</td></tr>}</tbody>
                </table>
            </div>
        </div>
    </main>;
}
