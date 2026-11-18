import { z } from "zod";

/**
 * Contrato compartilhado de produto.
 *
 * O tipo `Product` também é consumido pela feature feedback; mantenha os campos
 * e a assinatura de `getProductById` alinhados com o plano daquela feature.
 */

export const PRODUCTS_PAGE_SIZE = 12;
export const PRODUCTS_PAGE_SIZE_MAX = 24;
export const PRODUCTS_MAX_PAGE = 1_000_000;
export const PRODUCTS_CACHE_TAG = "products";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  externalLink: string;
  score: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  name: string;
  description?: string;
  imageUrl: string;
  externalLink: string;
};

/** Envelope da listagem: `nextPage` evita uma página extra vazia no scroll. */
export type ProductPage = {
  items: Product[];
  nextPage: number | null;
};

export const listProductsInputSchema = z.object({
  cursor: z
    .number()
    .int("Informe uma página inteira.")
    .min(1, "A página começa em 1.")
    .max(PRODUCTS_MAX_PAGE, "Página fora do limite.")
    .optional(),
  limit: z
    .number()
    .int("Informe um limite inteiro.")
    .min(1, "O limite mínimo é 1.")
    .max(PRODUCTS_PAGE_SIZE_MAX, `O limite máximo é ${PRODUCTS_PAGE_SIZE_MAX}.`)
    .default(PRODUCTS_PAGE_SIZE),
});

export type ListProductsInput = z.infer<typeof listProductsInputSchema>;

export const createProductInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome precisa ter ao menos 2 caracteres.")
    .max(120, "O nome pode ter no máximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .max(600, "A descrição pode ter no máximo 600 caracteres.")
    .optional(),
  imageUrl: z
    .url("Informe uma URL de imagem válida.")
    .startsWith("http", "A URL da imagem precisa começar com http."),
  externalLink: z
    .url("Informe uma URL de loja válida.")
    .startsWith("http", "O link externo precisa começar com http."),
});

export type CreateProductPayload = z.infer<typeof createProductInputSchema>;

/** Linha crua de `public.products`, em snake_case, como o Supabase devolve. */
export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  external_link: string;
  score: boolean;
  created_at: string;
  updated_at: string;
};

function toIsoString(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

/** Converte a linha do banco no contrato público em camelCase. */
export function mapProductRow(row: ProductRow): Product {
  const description = row.description?.trim();

  return {
    id: row.id,
    name: row.name,
    description: description ? description : null,
    imageUrl: row.image_url,
    externalLink: row.external_link,
    score: row.score,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}
