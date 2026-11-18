"use client";

import { ImageOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Imagem do produto com fallback próprio. `next/image` fica de fora porque os
 * domínios das lojas não são conhecidos e `next.config.ts` pertence à feature
 * home; um `<img>` simples mantém a página independente de configuração.
 *
 * O `onError` sozinho não basta: quando a URL falha antes da hidratação (DNS
 * inexistente, 404 rápido), o evento já aconteceu e o React nunca o recebe — a
 * ficha mostrava o ícone de imagem quebrada do navegador. Na montagem, a
 * imagem é conferida (`complete` + `naturalWidth`) para cair no fallback.
 */
export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const normalizedSrc = src.trim();
  const showFallback = failedSrc === normalizedSrc || normalizedSrc.length === 0;

  useEffect(() => {
    const node = imgRef.current;

    if (node?.complete && node.naturalWidth === 0) {
      setFailedSrc(normalizedSrc);
    }
  }, [normalizedSrc]);

  return (
    <div className={cn("relative overflow-hidden bg-paper-raised", className)}>
      {showFallback ? (
        <div className="flex h-full min-h-56 w-full flex-col items-center justify-center gap-3 bg-[repeating-linear-gradient(135deg,var(--auth-line)_0,var(--auth-line)_1px,transparent_1px,transparent_12px)] text-ink-soft">
          <ImageOff aria-hidden className="size-8" strokeWidth={1.4} />
          <p className="text-[0.75rem]">Imagem indisponível</p>
        </div>
      ) : (
        // biome-ignore lint/performance/noImgElement: os domínios das lojas não são conhecidos e next.config.ts pertence à feature home
        <img
          ref={imgRef}
          src={normalizedSrc}
          alt={alt}
          decoding="async"
          onError={() => setFailedSrc(normalizedSrc)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
