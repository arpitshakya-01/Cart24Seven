export function calculateDeliveryCharge(orderAmount) {
    const amount = Number(orderAmount);
    if (!Number.isFinite(amount) || amount < 0) {
        throw new RangeError("Order amount must be a non-negative number.");
    }
    return amount < 499 ? 40 : 0;
}
