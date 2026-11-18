"use client";

import Link from "next/link";
import type { Product } from "@/features/products/schema";
import { ProductImage } from "./product-image";

type ProductCardProps = {
  product: Product;
  eager?: boolean;
};

const CARD_IMAGE_SIZES =
  "(max-width: 639px) 92vw, (max-width: 1023px) 46vw, (max-width: 1279px) 31vw, 23vw";

/**
 * Card do catálogo: imagem, nome e descrição curta.
 *
 * O nome leva para `/products/[id]`, onde ficam as avaliações. O link se
 * estende sobre o card via `after`, então a área clicável acompanha o cartão
 * inteiro sem criar um segundo link.
 */
export function ProductCard({ product, eager = false }: ProductCardProps) {
  const description = product.description?.trim() || "Sem descrição.";

  return (
    <li className="group relative flex flex-col border border-line bg-paper-raised transition-colors hover:border-signal/60 focus-within:border-signal/60 motion-reduce:transition-none">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-line bg-paper">
        <ProductImage
          src={product.imageUrl}
          alt={`Imagem de ${product.name}`}
          sizes={CARD_IMAGE_SIZES}
          eager={eager}
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <h3 className="font-display text-lg leading-snug tracking-[-0.02em] text-pretty">
          <Link
            href={`/products/${product.id}`}
            className="rounded-sm transition-colors group-hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal motion-reduce:transition-none after:absolute after:inset-0"
          >
            <span className="line-clamp-2">{product.name}</span>
          </Link>
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{description}</p>
      </div>
    </li>
  );
}
