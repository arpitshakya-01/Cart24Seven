import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ProductProvider } from "./context/ProductContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <ThemeProvider>
        <ToastProvider>
        <AuthProvider>
            <ProductProvider>
                <CartProvider>
                    <WishlistProvider>
                        <App />
                    </WishlistProvider>
                </CartProvider>
            </ProductProvider>
        </AuthProvider>
        </ToastProvider>
        </ThemeProvider>
    </BrowserRouter>
);
