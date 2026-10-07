import api from "./api";

export const placeOrder = async (address) => (await api.post("/orders/place", address)).data;
export const placeDemoPayment = async (address, method) => (await api.post("/orders/payment/demo", { address, method })).data;
export const getPaymentConfig = async () => (await api.get("/orders/payment/config")).data;
export const createRazorpayOrder = async (address) => (await api.post("/orders/payment/create-order", address)).data;
export const verifyRazorpayPayment = async (payment) => (await api.post("/orders/payment/verify", payment)).data;
export const cancelRazorpayAttempt = async (attemptId) => (await api.post(`/orders/payment/${attemptId}/cancel`)).data;
export const getMyOrders = async () => (await api.get("/orders/my-orders")).data;
export const getAdminOrders = async () => (await api.get("/orders/admin/all")).data;
export const getSellerOrders = async () => (await api.get("/orders/seller/orders")).data;
export const updateOrderStatus = async (id, status) => (await api.patch("/orders/admin/" + id + "/status", { status })).data;

export const getOrderReview = async (id) => (await api.get(`/reviews/orders/${id}`)).data;
export const saveOrderReview = async (id, review) => (await api.post(`/reviews/orders/${id}`, review)).data;
export const cancelMyOrder = async (id) => (await api.post(`/orders/${id}/cancel`)).data;
