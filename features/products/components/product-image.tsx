"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string;
  alt: string;
  sizes: string;
  eager?: boolean;
  className?: string;
};

/**
 * Imagem do card com fallback visual próprio.
 *
 * `next/image` cobre o caso feliz (AVIF/WebP, `sizes` e lazy loading). Se a URL
 * falhar, o fallback usa a inicial do produto sobre um gradiente — sem ícone de
 * imagem quebrada e sem mudar a altura do card.
 */
export function ProductImage({ src, alt, sizes, eager = false, className }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const normalizedSrc = src.trim();
  const hasHttpSrc = /^https?:\/\//i.test(normalizedSrc);
  const showFallback = !hasHttpSrc || failedSrc === normalizedSrc;
  const initial = Array.from(alt.trim())[0]?.toLocaleUpperCase("pt-BR") ?? "*";

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex h-full w-full items-center justify-center bg-linear-to-br from-line via-paper to-signal-dark/50",
          className,
        )}
      >
        <span aria-hidden className="font-display text-6xl font-semibold text-ink-soft/35">
          {initial}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={normalizedSrc}
      alt={alt}
      fill
      sizes={sizes}
      quality={80}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailedSrc(normalizedSrc)}
      className={cn("object-cover", className)}
    />
  );
}
