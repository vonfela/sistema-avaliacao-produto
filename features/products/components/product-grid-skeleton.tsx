import { PRODUCTS_PAGE_SIZE } from "@/features/products/schema";

/** Mantém o grid do feed e o do skeleton idênticos em qualquer breakpoint. */
export const PRODUCT_GRID_CLASSES =
  "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

const SKELETON_KEYS = Array.from({ length: PRODUCTS_PAGE_SIZE }, (_, index) => `skeleton-${index}`);

export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="border border-line bg-paper-raised">
      <div className="aspect-[4/3] animate-pulse bg-line/60 motion-reduce:animate-none" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-5 w-3/4 animate-pulse bg-line/70 motion-reduce:animate-none" />
        <div className="h-3.5 w-full animate-pulse bg-line/60 motion-reduce:animate-none" />
        <div className="h-3.5 w-2/3 animate-pulse bg-line/60 motion-reduce:animate-none" />
      </div>
    </div>
  );
}

type ProductGridSkeletonProps = {
  count?: number;
  label?: string;
};

export function ProductGridSkeleton({
  count = PRODUCTS_PAGE_SIZE,
  label = "Carregando produtos",
}: ProductGridSkeletonProps) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className={PRODUCT_GRID_CLASSES} aria-hidden>
        {SKELETON_KEYS.slice(0, count).map((key) => (
          <ProductCardSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}
