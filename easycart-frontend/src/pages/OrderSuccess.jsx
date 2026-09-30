import { Link, useLocation } from "react-router-dom";
import { CheckCircle, ShoppingBag, Truck, Home } from "lucide-react";
import lenovoImage from "../assets/lenovo-loq-rtx5050.png";
import { resolveProductImage } from "../services/resolveProductImage";

function OrderSuccess() {
    const location = useLocation();

    const order = location.state?.order;

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
                    <ShoppingBag size={70} className="mx-auto text-green-600 mb-4" />

                    <h2 className="text-2xl font-bold mb-3">
                        No Order Found
                    </h2>

                    <p className="text-gray-500 mb-6">
                        You haven't placed any order yet.
                    </p>

                    <Link to="/">
                        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold">
                            Continue Shopping
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-100 min-h-screen py-12 px-5">

            <div className="max-w-4xl mx-auto">

                {/* Success Card */}

                <div className="bg-white rounded-3xl shadow-xl p-10">

                    {/* Green Check */}

                    <div className="text-center">
                        <CheckCircle
                            size={90}
                            className="mx-auto text-green-600 mb-4"
                        />

                        <h1 className="text-4xl font-bold text-green-700">
                            Order Placed Successfully!
                        </h1>

                        <p className="text-gray-600 mt-3 text-lg">
                            Thank you for shopping with <span className="font-semibold">EasyCart</span>.
                        </p>
                        {order.paymentMethod?.startsWith("DEMO_") && <p className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm font-semibold text-violet-800">Demo payment only: {order.paymentMethod.slice(5).replaceAll("_", " ")} selected. No money was charged or transferred; this order is marked SIMULATED.</p>}
                    </div>

                    {/* Order ID */}

                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mt-8 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-500">
                                Order ID
                            </p>

                            <h2 className="text-2xl font-bold text-green-700">
                                #{order.id}
                            </h2>
                        </div>

                        <div className="text-right">
                            <p className="text-sm text-gray-500">
                                Status
                            </p>

                            <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm">
                {order.orderStatus}
              </span>
                        </div>
                    </div>

                    {/* Product Details */}

                    <div className="mt-10">

                        <h2 className="text-2xl font-bold mb-5">
                            Ordered Product
                        </h2>

                        <div className="border rounded-2xl p-5 flex gap-5 items-center bg-slate-50">

                            <img
                                src={resolveProductImage(order.productImage) || lenovoImage}
                                onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = lenovoImage; }}
                                alt={order.productName}
                                className="w-32 h-32 object-contain bg-white rounded-xl p-2 shadow"
                            />

                            <div className="flex-1">

                                <h3 className="text-xl font-bold">
                                    {order.productName}
                                </h3>

                                <p className="text-gray-600 mt-1">
                                    Quantity : {order.quantity}
                                </p>

                                <p className="text-green-700 font-bold text-2xl mt-2">
                                    ₹{Number(order.productPrice).toLocaleString("en-IN")}
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* Delivery Address */}

                    <div className="mt-10">

                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Home className="text-green-600" />
                            Delivery Address
                        </h2>

                        <div className="bg-slate-50 border rounded-2xl p-5">

                            <p className="font-bold text-lg">
                                {order.customerName}
                            </p>

                            <p>{order.phone}</p>

                            <p className="mt-2">
                                {order.address}
                            </p>

                            <p>
                                {order.city}, {order.state}
                            </p>

                            <p>{order.pincode}</p>

                        </div>

                    </div>

                    {/* Payment Summary */}

                    <div className="mt-10">

                        <h2 className="text-2xl font-bold mb-4">
                            Payment Summary
                        </h2>

                        <div className="bg-slate-50 border rounded-2xl p-5 space-y-3">

                            <div className="flex justify-between">
                                <span>Items total (tax inclusive)</span>
                                <span>₹{Number(order.subtotal).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Includes GST</span>
                                <span>₹{Number(order.gst).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Delivery Charge</span>

                                <span className="font-semibold text-green-700">
                  {Number(order.deliveryCharge) === 0
                      ? "FREE"
                      : `₹${Number(order.deliveryCharge).toFixed(2)}`}
                </span>
                            </div>

                            <hr />

                            <div className="flex justify-between text-3xl font-bold text-green-700">
                                <span>Total Paid</span>

                                <span>
                  ₹{Number(order.totalAmount).toFixed(2)}
                </span>
                            </div>

                        </div>

                    </div>

                    {/* Delivery Status */}

                    <div className="mt-10 bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-4 items-center">

                        <Truck size={45} className="text-green-600" />

                        <div>

                            <h3 className="font-bold text-lg text-green-700">
                                Estimated Delivery
                            </h3>

                            <p className="text-gray-700">
                                Your order will be delivered within
                                <span className="font-semibold"> 3-5 Business Days.</span>
                            </p>

                        </div>

                    </div>

                    {/* Buttons */}

                    <div className="mt-10 grid md:grid-cols-2 gap-4">

                        <Link to="/">
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold">
                                Continue Shopping
                            </button>
                        </Link>

                        <Link to="/my-orders">
                            <button className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50 py-3 rounded-xl font-bold">
                                View My Orders
                            </button>
                        </Link>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default OrderSuccess;
