import { Link, useNavigate } from "@tanstack/react-router";
import { MessageSquareQuote, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cart } from "@/lib/cart";
import { STOCK_LABEL, discountPercent, hasDiscount, maxOrderQty, purchaseState, sellingPrice, stockState } from "@/lib/product-rules";
import { naira, type Product } from "@/lib/shop-types";
import { cn } from "@/lib/utils";

export function addProductToCart(p: Product, quantity: number) {
  const price = sellingPrice(p);
  if (price == null) return;
  cart.add({ productId: p.id, slug: p.slug, name: p.name, price, imageUrl: p.featuredImage?.url ?? null, maxQty: maxOrderQty(p) }, quantity);
}

export function PriceBlock({ product: p, size = "md" }: { product: Product; size?: "md" | "lg" }) {
  const price = sellingPrice(p);
  const pct = discountPercent(p);
  if (price == null) {
    return <p className={cn("font-heading font-semibold text-foreground", size === "lg" ? "text-2xl" : "text-lg")}>Price on request</p>;
  }
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className={cn("font-heading font-semibold text-foreground", size === "lg" ? "text-3xl" : "text-xl")}>{naira.format(price)}</span>
      {hasDiscount(p) && (
        <>
          <span className="text-sm text-muted-foreground line-through">{naira.format(p.price!)}</span>
          {size === "lg" && pct && <span className="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-extrabold text-brand-deep">Save {pct}%</span>}
        </>
      )}
    </div>
  );
}

export function StockLabel({ product: p, className }: { product: Product; className?: string }) {
  const state = stockState(p);
  if (sellingPrice(p) == null) return <span className={cn("shop-stock shop-stock-quote", className)}>Request a quote</span>;
  const lowStock = p.trackStock && p.stockQuantity > 0 && p.stockQuantity <= 5;
  return (
    <span className={cn("shop-stock", state !== "in_stock" && "shop-stock-out", state === "out_of_stock" && "shop-stock-none", className)}>
      {lowStock ? `Only ${p.stockQuantity} left` : STOCK_LABEL[state]}
    </span>
  );
}

/** Add to Cart / Buy Now for purchasable products, Request a Quote for quote-only ones, status otherwise. */
export function PurchaseActions({ product: p, quantity = 1, layout = "card" }: { product: Product; quantity?: number; layout?: "card" | "detail" }) {
  const navigate = useNavigate();
  const state = purchaseState(p);
  const tall = layout === "detail" ? "h-13 text-base" : "h-11";

  if (state === "quote") {
    return (
      <Button asChild className={cn("w-full rounded-xl font-bold", tall)}>
        <Link to="/contact-us" search={{ product: p.name }}>
          <MessageSquareQuote aria-hidden="true" /> Request a Quote
        </Link>
      </Button>
    );
  }
  if (state === "unavailable") {
    return (
      <Button type="button" disabled variant="outline" className={cn("w-full rounded-xl font-bold", tall)}>
        {STOCK_LABEL[stockState(p)] === "In stock" ? "Unavailable" : STOCK_LABEL[stockState(p)]}
      </Button>
    );
  }
  return (
    <div className={cn("grid gap-2.5", layout === "detail" ? "sm:grid-cols-2" : "grid-cols-2")}>
      <Button
        type="button"
        variant="outline"
        className={cn("rounded-xl font-bold", tall)}
        onClick={() => {
          addProductToCart(p, quantity);
          toast.success(`${p.name} added to your cart`, { action: { label: "View cart", onClick: () => navigate({ to: "/checkout" }) } });
        }}
      >
        <ShoppingCart aria-hidden="true" /> Add to Cart
      </Button>
      <Button
        type="button"
        className={cn("rounded-xl font-bold", tall)}
        onClick={() => navigate({ to: "/checkout", search: { buy: p.slug, qty: quantity } })}
      >
        <Zap aria-hidden="true" /> Buy Now
      </Button>
    </div>
  );
}
