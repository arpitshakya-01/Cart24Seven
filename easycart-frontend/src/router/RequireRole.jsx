import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireRole({ roles }) {
    const { user, role, isLoggedIn } = useAuth();
    const adminRoute = roles.includes("ADMIN");
    if (!user || !isLoggedIn) return <Navigate to={adminRoute ? "/admin/login" : "/login"} replace/>;
    if (!roles.includes(role)) return <Navigate to={adminRoute ? "/admin/login?error=role" : role === "SELLER" ? "/seller" : "/"} replace/>;
    return <Outlet/>;
}
