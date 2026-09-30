import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const ToastContext = createContext(null);
const icons = { success: CheckCircle2, error: XCircle, info: Info };

export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);
    const dismiss = useCallback((id) => setItems((current) => current.filter((item) => item.id !== id)), []);
    const toast = useCallback((message, type = "success") => {
        const id = `${Date.now()}-${Math.random()}`;
        setItems((current) => [...current, { id, message, type }]);
        window.setTimeout(() => dismiss(id), 3500);
    }, [dismiss]);
    return <ToastContext.Provider value={toast}>{children}<div className="pointer-events-none fixed right-3 top-20 z-[100] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 sm:right-5" aria-live="polite" aria-atomic="false">{items.map((item) => { const Icon = icons[item.type] || Info; return <div key={item.id} role={item.type === "error" ? "alert" : "status"} className={`pointer-events-auto flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-xl ${item.type === "error" ? "border-rose-200 text-rose-800" : item.type === "success" ? "border-emerald-200 text-emerald-800" : "border-sky-200 text-sky-800"}`}><Icon size={20} className="shrink-0"/><p className="min-w-0 flex-1 text-sm font-semibold">{item.message}</p><button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16}/></button></div>; })}</div></ToastContext.Provider>;
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used inside ToastProvider");
    return context;
}
