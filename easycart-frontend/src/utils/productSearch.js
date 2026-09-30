export function productCategory(product) {
    return typeof product?.category === "string" ? product.category : product?.category?.categoryName || "";
}

export function searchProducts(products, query) {
    const terms = String(query || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return products.filter((product) => {
        const searchableFields = [product.name, product.productName, product.brand, productCategory(product)]
            .map((value) => String(value || "").toLowerCase());
        return terms.every((term) => searchableFields.some((field) => field.includes(term)));
    });
}
