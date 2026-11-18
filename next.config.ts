import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    agentUpgrade: "security",
  },
  partialPrefetching: true,
  images: {
    /**
     * As URLs de imagem vêm de cadastro manual, então aceitamos qualquer host
     * HTTPS. Risco aceito nesta entrega: a API de otimização pode buscar hosts
     * arbitrários. Em produção, troque `hostname: "**"` por uma allowlist de
     * CDNs conhecidas.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    /**
     * O default do Next 16 é `[75]`. Sem o 80 explícito, `quality={80}` seria
     * silenciosamente arredondado para 75.
     */
    qualities: [75, 80],
  },
  turbopack: {
    /**
     * Fixa a raiz do Turbopack neste projeto. Sem isso, um package-lock.json
     * perdido em /Users/fct94 faz o Next subir a raiz ate o home e empacotar o
     * diretorio inteiro.
     */
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
