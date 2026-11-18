import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeHero } from "@/features/products/components/home-hero";
import { ProductFeed } from "@/features/products/components/product-feed";
import { ProductGridSkeleton } from "@/features/products/components/product-grid-skeleton";
import { PRODUCTS_PAGE_SIZE } from "@/features/products/schema";
import { listProducts } from "@/server/products/repository";

export const metadata: Metadata = {
  title: "Catálogo de produtos",
  description:
    "Catálogo aberto de produtos com avaliações de quem já comprou. Leia antes de decidir.",
};

/**
 * Home: catálogo público de produtos.
 *
 * `listProducts` é cacheada e não lê `cookies()`/`headers()`, então roda no
 * prerender e preenche o shell estático com a primeira página.
 *
 * O `<Suspense>` não é para o banco: é para o `ProductFeed`. Como Client
 * Component, o TanStack Query avalia `Date.now()` ao montar a query, e o Next 16
 * recusa valor instável dentro do prerender (`blocking-prerender-current-time-client`).
 * A fronteira joga o feed para o request e mantém o hero no shell estático.
 */
export default async function HomePage() {
  const initialPage = await listProducts({ page: 1, limit: PRODUCTS_PAGE_SIZE });

  return (
    <>
      <HomeHero />

      <section
        id="catalogo"
        aria-labelledby="catalogo-titulo"
        className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16"
      >
        <h2 id="catalogo-titulo" className="sr-only">
          Produtos do catálogo
        </h2>

        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductFeed initialData={initialPage} pageSize={PRODUCTS_PAGE_SIZE} />
        </Suspense>
      </section>
    </>
  );
}
