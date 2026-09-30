const DEFAULT_PLATFORM_FEE_PERCENT = 8;
const DEFAULT_PROFIT_MARGIN_PERCENT = 20;

function charmPrice(value) {
    if (!Number.isFinite(value) || value < 0) return 0;
    const nextWhole = Math.ceil(value - 1e-9);
    let candidate = Number((nextWhole - 0.01).toFixed(2));
    if (candidate + 1e-9 < value) candidate = Number((candidate + 1).toFixed(2));
    return Math.max(0.99, candidate);
}

export function calculatePricing({ costPrice, operatingCost = 0, platformFeePercent = DEFAULT_PLATFORM_FEE_PERCENT, profitMarginPercent = DEFAULT_PROFIT_MARGIN_PERCENT, discount = 0, gstRate = 18 }) {
    if (costPrice == null || String(costPrice).trim() === "") return { error: "Enter product cost to calculate a profitable listing price." };
    const cost = Number(costPrice);
    const operations = Number(operatingCost || 0);
    const feePercent = Number(platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT);
    const marginPercent = Number(profitMarginPercent ?? DEFAULT_PROFIT_MARGIN_PERCENT);
    const discountPercent = Number(discount || 0);
    const taxPercent = Number(gstRate ?? 18);
    if (![cost, operations, feePercent, marginPercent, discountPercent, taxPercent].every(Number.isFinite)) return { error: "Enter valid cost and percentage values." };
    if (cost <= 0 || operations < 0) return { error: "Product cost must be above zero; operating cost cannot be negative." };
    if (feePercent < 0 || feePercent > 50 || marginPercent < 0 || marginPercent > 90 || feePercent + marginPercent >= 100)
        return { error: "Platform fee and profit margin must be valid and total less than 100%." };
    if (discountPercent < 0 || discountPercent > 90) return { error: "Discount must be between 0% and 90%." };
    if (![0, 0.25, 1, 1.5, 3, 5, 12, 18, 28, 40].includes(taxPercent)) return { error: "Choose the applicable rate for the product's HSN code." };
    const baseCost = cost + operations;
    const requiredSalePrice = baseCost / (1 - (feePercent + marginPercent) / 100);
    const taxablePrice = charmPrice(requiredSalePrice);
    const price = Number((taxablePrice * (1 + taxPercent / 100)).toFixed(2));
    const mrp = discountPercent ? Math.ceil((price / (1 - discountPercent / 100)) * 100) / 100 : price;
    const platformFee = taxablePrice * feePercent / 100;
    const estimatedProfit = taxablePrice - platformFee - baseCost;
    const includedGst = price * taxPercent / (100 + taxPercent);
    return { price, mrp, taxablePrice, gstRate: taxPercent, includedGst, baseCost, platformFee, estimatedProfit, feePercent, marginPercent };
}
