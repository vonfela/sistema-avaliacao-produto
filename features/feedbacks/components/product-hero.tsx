import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/features/products/schema";
import { ProductImage } from "./product-image";
import { StarRating } from "./star-rating";

type ProductHeroProps = {
  product: Product;
  average: number | null;
  count: number;
  statsUnavailable?: boolean;
};

function formatAverage(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function ProductHero({ product, average, count, statsUnavailable }: ProductHeroProps) {
  return (
    <header>
      <nav aria-label="Trilha de navegação">
        <ol className="flex flex-wrap items-center gap-2 text-[0.75rem] text-ink-soft">
          <li>
            <Link
              href="/"
              className="rounded-sm transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              Catálogo
            </Link>
          </li>
          <li aria-hidden className="text-line">
            /
          </li>
          <li aria-current="page" className="max-w-[16rem] truncate text-ink sm:max-w-xs">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 translate-x-2.5 translate-y-2.5 bg-signal-dark"
          />
          <ProductImage
            src={product.imageUrl}
            alt={`Imagem de ${product.name}`}
            className="relative aspect-[4/3] border border-ink/15"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-8 lg:py-1">
          <div>
            <p className="flex items-center gap-3 text-[0.75rem] font-medium text-ink-soft">
              <span aria-hidden className="h-px w-8 bg-signal" />
              Ficha de teste
            </p>

            <h1 className="mt-4 font-display text-4xl leading-[1.02] tracking-[-0.045em] break-words text-balance sm:text-5xl">
              {product.name}
            </h1>

            {product.description ? (
              <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-7 break-words text-pretty text-ink-soft">
                {product.description}
              </p>
            ) : (
              <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-7 text-ink-soft">
                Este produto ainda não tem descrição.
              </p>
            )}

            <Link
              href={product.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 border-b border-ink/30 pb-1 text-[0.8125rem] font-medium text-ink transition-colors hover:border-signal hover:text-signal focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
            >
              Ver na loja
              <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.8} />
            </Link>
          </div>

          <div className="border-t border-line pt-6">
            {statsUnavailable ? (
              <div>
                <p className="font-display text-2xl tracking-[-0.03em]">Nota indisponível</p>
                <p className="mt-1 text-[0.8125rem] leading-6 text-ink-soft">
                  Não foi possível carregar as avaliações agora.
                </p>
              </div>
            ) : average !== null && count > 0 ? (
              <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
                <p className="flex items-baseline gap-1.5">
                  <span className="font-display text-5xl leading-none tracking-[-0.045em]">
                    {formatAverage(average)}
                  </span>
                  <span className="text-[0.8125rem] text-ink-soft">de 5</span>
                </p>

                <div className="flex flex-col gap-1.5">
                  <StarRating score={average} label={`Nota média ${formatAverage(average)} de 5`} />
                  <p className="text-[0.8125rem] text-ink-soft">
                    {count === 1 ? "1 avaliação" : `${count} avaliações`}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-display text-2xl tracking-[-0.03em]">Ainda sem nota</p>
                <p className="mt-1 text-[0.8125rem] leading-6 text-ink-soft">
                  Seja a primeira pessoa a avaliar este produto.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
