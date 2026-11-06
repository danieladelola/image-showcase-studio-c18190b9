// Pure storefront rules shared by the browser, the server and tests.
import type { Availability, Product } from "./shop-types";

export const MAX_QTY_PER_LINE = 99;

type PricingFields = Pick<Product, "price" | "salePrice" | "quoteOnly">;
type StockFields = Pick<Product, "trackStock" | "stockQuantity" | "availability">;

/** The price a customer pays per unit, or null when the product is quote-only. */
export function sellingPrice(p: PricingFields): number | null {
  if (p.quoteOnly || p.price == null) return null;
  if (p.salePrice != null && p.salePrice < p.price) return p.salePrice;
  return p.price;
}

export function hasDiscount(p: PricingFields) {
  return !p.quoteOnly && p.price != null && p.salePrice != null && p.salePrice < p.price;
}

export function stockState(p: StockFields): Availability {
  if (p.trackStock) return p.stockQuantity > 0 ? "in_stock" : "out_of_stock";
  return p.availability;
}

export const STOCK_LABEL: Record<Availability, string> = {
  in_stock: "In stock",
  out_of_stock: "Out of stock",
  preorder: "Pre-order",
};

/** Most units a customer can order in one line. */
export function maxOrderQty(p: StockFields) {
  if (p.trackStock) return Math.max(0, Math.min(MAX_QTY_PER_LINE, p.stockQuantity));
  return p.availability === "out_of_stock" ? 0 : MAX_QTY_PER_LINE;
}

export type PurchaseState = "buy" | "quote" | "unavailable";

/** Published, available products with a confirmed price can be bought online. */
export function purchaseState(p: PricingFields & StockFields & Pick<Product, "status">): PurchaseState {
  if (p.status !== "published") return "unavailable";
  if (sellingPrice(p) == null) return "quote";
  return maxOrderQty(p) > 0 ? "buy" : "unavailable";
}

export function discountPercent(p: PricingFields) {
  if (!hasDiscount(p)) return null;
  return Math.round((1 - p.salePrice! / p.price!) * 100);
}
