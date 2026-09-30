import { Outlet, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Home from "../pages/Home";
import SearchResults from "../pages/SearchResults";
import HeroSlider from "../components/HeroSlider";
import Categories from "../pages/Categories";
import Cart from "../pages/Cart";
import Wishlist from "../pages/Wishlist";
import Checkout from "../pages/Checkout";
import MyOrders from "../pages/MyOrders";
import OrderDetails from "../pages/OrderDetails";
import OrderSuccess from "../pages/OrderSuccess";
import ProductDetails from "../pages/ProductDetails";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminDashboard from "../pages/AdminDashboard";
import AdminProfile from "../pages/AdminProfile";
import AdminOrders from "../pages/AdminOrders";
import Customers from "../pages/Customers";
import ManageProducts from "../pages/ManageProducts";
import AddProduct from "../pages/AddProduct";
import EditProduct from "../pages/EditProduct";
import SellerDashboard from "../pages/SellerDashboard";
import SellerProfile from "../pages/SellerProfile";
import BuyerProfile from "../pages/BuyerProfile";
import BrowsingHistory from "../pages/BrowsingHistory";
import Navbar from "../components/Navbar";
import RequireRole from "./RequireRole";
import Footer from "../components/Footer";

function StorefrontAccess() {
    const { user, role, isLoggedIn } = useAuth();
    if (role === "ADMIN") return <Navigate to="/admin" replace/>;
    if (role === "SELLER") return <Navigate to="/seller" replace/>;
    if (!user || !isLoggedIn || role !== "BUYER") return <Navigate to="/login" replace/>;
    return <Outlet/>;
}

function AppRoutes() {
    return <div className="flex min-h-screen flex-col"><Navbar/><div className="flex-1"><Routes>
        <Route element={<StorefrontAccess/>}>
            <Route path="/" element={<><HeroSlider/><Home/></>}/>
            <Route path="/categories" element={<Categories/>}/><Route path="/search" element={<SearchResults/>}/>
            <Route path="/product/:id" element={<ProductDetails/>}/>
        </Route>
        <Route path="/login" element={<Login/>}/><Route path="/admin/login" element={<Login/>}/><Route path="/register" element={<Register/>}/>
        <Route element={<RequireRole roles={["BUYER"]}/> }>
            <Route path="/cart" element={<Cart/>}/><Route path="/wishlist" element={<Wishlist/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/order-success" element={<OrderSuccess/>}/><Route path="/my-orders" element={<MyOrders/>}/><Route path="/my-orders/:id" element={<OrderDetails/>}/><Route path="/profile" element={<BuyerProfile/>}/><Route path="/browsing-history" element={<BrowsingHistory/>}/>
        </Route>
        <Route element={<RequireRole roles={["ADMIN"]}/> }>
            <Route path="/admin" element={<AdminDashboard/>}/><Route path="/admin/profile" element={<AdminProfile/>}/><Route path="/admin/orders" element={<AdminOrders/>}/><Route path="/admin/customers" element={<Customers/>}/><Route path="/admin/manage-products" element={<ManageProducts/>}/><Route path="/admin/add-product" element={<AddProduct/>}/><Route path="/admin/edit-product/:id" element={<EditProduct/>}/>
        </Route>
        <Route element={<RequireRole roles={["SELLER"]}/> }>
            <Route path="/seller" element={<SellerDashboard/>}/><Route path="/seller/profile" element={<SellerProfile/>}/><Route path="/seller/manage-products" element={<ManageProducts/>}/><Route path="/seller/add-product" element={<AddProduct/>}/><Route path="/seller/edit-product/:id" element={<EditProduct/>}/>
        </Route>
        <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes></div><Footer/></div>;
}
export default AppRoutes;


