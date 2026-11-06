import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, Search, ShieldCheck, Star, Truck, Wrench } from "lucide-react";

import { PriceBlock, PurchaseActions, StockLabel } from "@/components/purchase-actions";
import { discountPercent, sellingPrice } from "@/lib/product-rules";
import { shopQuery } from "@/lib/shop.queries";
import type { Product } from "@/lib/shop-types";

type Sort = "featured" | "price-asc" | "price-desc";

export function ProductShop({ limit }: { limit?: number } = {}) {
  const { data } = useSuspenseQuery(shopQuery);
  const { products } = data;
  const categories = data.categories.filter((c) => c.productCount > 0);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("featured");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) => (category === "All" || p.categorySlug === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.features.some((f) => f.value.toLowerCase().includes(q))),
    );
    // Quote-only products have no price, so they sort to the end either way.
    const price = (p: Product, dir: 1 | -1) => sellingPrice(p) ?? (dir === 1 ? Infinity : -Infinity);
    if (sort === "price-asc") return [...list].sort((a, b) => price(a, 1) - price(b, 1));
    if (sort === "price-desc") return [...list].sort((a, b) => price(b, -1) - price(a, -1));
    return list;
  }, [products, category, query, sort]);

  return (
    <section id="shop" className="section-space scroll-mt-20 bg-card">
      <div className="site-wrap">
        <div className="mb-10 grid gap-4 lg:grid-cols-2 lg:items-end">
          <div className="grid gap-4">
            <span className="eyebrow eyebrow-plain">Shop solar</span>
            <h2 className="section-heading">Solar systems, appliances and backup power.</h2>
          </div>
          <p className="text-lead lg:max-w-md lg:justify-self-end">Factory-direct equipment with professional installation available on every order.</p>
        </div>

        <div className="shop-toolbar">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Product categories">
            <button type="button" role="tab" aria-selected={category === "All"} onClick={() => setCategory("All")} className="shop-chip">
              All <span className="shop-chip-count">{products.length}</span>
            </button>
            {categories.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={category === c.slug} onClick={() => setCategory(c.slug)} className="shop-chip">
                {c.name} <span className="shop-chip-count">{c.productCount}</span>
              </button>
            ))}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <label className="admin-field w-full sm:w-64">
              <Search aria-hidden="true" />
              <span className="sr-only">Search products</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="form-control" />
            </label>
            <label className="w-full sm:w-52">
              <span className="sr-only">Sort products</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="form-control min-h-13 rounded-xl">
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>

        <p className="mt-6 mb-5 text-sm text-muted-foreground" aria-live="polite">
          Showing {visible.length} {visible.length === 1 ? "product" : "products"}
        </p>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No products match your search.{" "}
            <button type="button" className="font-bold text-brand hover:underline" onClick={() => { setQuery(""); setCategory("All"); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {(limit ? visible.slice(0, limit) : visible).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {limit && visible.length > limit && (
          <div className="mt-8 flex justify-center">
            <Link to="/our-products" hash="shop" className="news-chip">View all products</Link>
          </div>
        )}

        <div className="mt-12 grid gap-4 rounded-2xl border border-border p-6 sm:grid-cols-3">
          {[
            { Icon: Truck, title: "Delivery nationwide", text: "Delivered to your home or site." },
            { Icon: Wrench, title: "Installation available", text: "Our team can fit everything for you." },
            { Icon: ShieldCheck, title: "Warranty backed", text: "Manufacturer warranty on every product." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-brand"><Icon className="size-5" aria-hidden="true" /></span>
              <div>
                <p className="font-heading font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const highlights = p.features.slice(0, 3);
  const pct = discountPercent(p);
  return (
    <article className="shop-card group">
      <Link to="/our-products/$slug" params={{ slug: p.slug }} className="shop-card-media" aria-label={p.name}>
        {p.featuredImage ? (
          <img src={p.featuredImage.url} alt={p.featuredImage.alt || p.name} loading="lazy" width={1024} height={1024} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="aspect-square w-full bg-accent" />
        )}
        {p.badge ? (
          <span className="shop-badge">{p.badge}</span>
        ) : (
          p.isFeatured && <span className="shop-badge inline-flex items-center gap-1"><Star className="size-3" aria-hidden="true" /> Featured</span>
        )}
        {pct && <span className="shop-badge shop-badge-sale">-{pct}%</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-5">
        {p.categoryName && <span className="text-[0.65rem] font-bold tracking-wider text-brand uppercase sm:text-xs">{p.categoryName}</span>}
        <h3 className="font-heading text-sm leading-snug font-semibold sm:text-lg">
          <Link to="/our-products/$slug" params={{ slug: p.slug }} className="hover:text-brand">{p.name}</Link>
        </h3>
        <ul className="hidden gap-1.5 text-sm text-muted-foreground sm:grid">
          {highlights.map((f) => (
            <li key={f.label + f.value} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />{f.value}</li>
          ))}
        </ul>
        <div className="shop-card-foot mt-auto grid gap-3 pt-2 sm:gap-4 sm:pt-3">
          <div className="flex flex-col items-start gap-1 border-t border-border pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-2 sm:pt-4">
            <PriceBlock product={p} />
            <StockLabel product={p} />
          </div>
          <PurchaseActions product={p} />
        </div>
      </div>
    </article>
  );
}
