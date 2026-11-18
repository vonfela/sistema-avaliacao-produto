"use client";

import { CircleAlert, LoaderCircle, PackageOpen } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { Product, ProductPage } from "@/features/products/schema";
import { trpc } from "@/lib/trpc/provider";
import { ProductCard } from "./product-card";
import { PRODUCT_GRID_CLASSES, ProductGridSkeleton } from "./product-grid-skeleton";

type ProductFeedProps = {
  initialData: ProductPage;
  pageSize: number;
};

/** Primeiros cards carregam a imagem adiantado; o resto fica lazy. */
const EAGER_IMAGE_COUNT = 4;

/**
 * Lista paginada do catálogo.
 *
 * A página 1 chega pronta do servidor como `initialData`, então o primeiro
 * paint não refaz a busca. As próximas páginas entram por `IntersectionObserver`
 * e são deduplicadas por `id`: um produto inserido entre duas páginas pode
 * repetir no offset.
 */
export function ProductFeed({ initialData, pageSize }: ProductFeedProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const query = trpc.products.list.useInfiniteQuery(
    { limit: pageSize },
    {
      getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
      initialData: { pages: [initialData], pageParams: [1] },
    },
  );

  const products = useMemo(() => {
    const pages = query.data?.pages ?? [];
    const seen = new Set<string>();

    return pages
      .flatMap((page) => page.items)
      .filter((product) => {
        if (seen.has(product.id)) return false;
        seen.add(product.id);
        return true;
      });
  }, [query.data]);

  const { fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage, refetch } = query;

  useEffect(() => {
    const node = loadMoreRef.current;

    // Com erro na próxima página, o observer para: o retry é explícito.
    if (!node || !hasNextPage || isFetchingNextPage || isFetchNextPageError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage();
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage]);

  if (query.isPending) {
    return <ProductGridSkeleton />;
  }

  if (query.isError && products.length === 0) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-5 border-l-2 border-destructive bg-destructive/5 px-4 py-5 sm:px-5"
      >
        <div className="flex gap-3">
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-display text-xl tracking-[-0.025em]">
              Não foi possível carregar o catálogo.
            </p>
            <p className="mt-1 text-[0.875rem] leading-6 text-ink-soft">
              Verifique a conexão e tente novamente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex h-9 items-center rounded-sm bg-ink px-4 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal motion-reduce:transition-none"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex max-w-md flex-col items-start gap-3 border border-dashed border-line bg-paper-raised/60 p-6">
        <PackageOpen aria-hidden className="size-6 text-signal" strokeWidth={1.6} />
        <p className="font-display text-xl tracking-[-0.025em]">O catálogo está vazio.</p>
        <p className="text-[0.875rem] leading-6 text-ink-soft">
          Nenhum produto foi cadastrado ainda. Volte em breve para ver as primeiras fichas.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className={PRODUCT_GRID_CLASSES} aria-busy={isFetchingNextPage}>
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} eager={index < EAGER_IMAGE_COUNT} />
        ))}
      </ul>

      {hasNextPage ? (
        <div ref={loadMoreRef} className="mt-10 flex min-h-10 items-center justify-center">
          {isFetchNextPageError ? (
            <div role="alert" className="flex flex-wrap items-center justify-center gap-3">
              <p className="text-[0.8125rem] text-destructive">
                Não foi possível carregar mais produtos.
              </p>
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                className="inline-flex h-8 items-center rounded-sm border border-ink px-3 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal motion-reduce:transition-none"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 text-[0.8125rem] text-ink-soft"
            >
              {isFetchingNextPage ? (
                <>
                  <LoaderCircle
                    aria-hidden
                    className="size-4 animate-spin text-signal motion-reduce:animate-none"
                    strokeWidth={2}
                  />
                  Carregando mais produtos…
                </>
              ) : (
                <span className="sr-only">Role para carregar mais produtos.</span>
              )}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-10 border-t border-line pt-6 text-center text-[0.8125rem] text-ink-soft">
          Você chegou ao fim do catálogo.
        </p>
      )}
    </>
  );
}

/** Mantém o tipo do item visível para quem consome o feed via props. */
export type ProductFeedItem = Product;
