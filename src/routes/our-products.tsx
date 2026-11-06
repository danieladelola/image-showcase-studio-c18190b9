import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/components/site-pages";
import { shopQuery } from "@/lib/shop.queries";

export const Route = createFileRoute("/our-products")({
  head: () => ({ meta: [
    { title: "Our Products | RUWATA Solar" },
    { name: "description", content: "Shop complete solar systems, solar panels, inverters, and battery storage supplied and installed by RUWATA." },
    { name: "keywords", content: "buy solar panels Nigeria, solar inverters, lithium batteries, solar kits, solar shop, RUWATA products" },
    { property: "og:title", content: "Solar Products | RUWATA" },
    { property: "og:description", content: "Solar panels, inverters, batteries and full systems with nationwide delivery." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(shopQuery),
  component: ProductsPage,
});
