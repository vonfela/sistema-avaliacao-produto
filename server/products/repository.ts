import "server-only";

import { nanoid } from "nanoid";
import { cacheLife, cacheTag } from "next/cache";
import {
  type CreateProductInput,
  mapProductRow,
  PRODUCTS_CACHE_TAG,
  type Product,
  type ProductPage,
  type ProductRow,
} from "@/features/products/schema";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Acesso a `public.products`.
 *
 * A tabela tem RLS ligado e nenhuma policy: toda leitura/escrita passa pelo
 * cliente com service role, que vive apenas no servidor.
 */

const PRODUCT_COLUMNS =
  "id, name, description, image_url, external_link, score, created_at, updated_at";

/**
 * Lista uma página do catálogo, do mais recente para o mais antigo.
 *
 * Busca `limit + 1` linhas para saber se existe próxima página sem precisar de
 * uma segunda consulta nem de uma página final vazia. O `id` entra como
 * desempate porque `created_at` pode empatar em inserções próximas.
 */
export async function listProducts(input: { page: number; limit: number }): Promise<ProductPage> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PRODUCTS_CACHE_TAG);

  const offset = (input.page - 1) * input.limit;

  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + input.limit);

  if (error) {
    throw new Error(`Falha ao listar produtos: ${error.message}`, { cause: error });
  }

  const rows = (data ?? []) as unknown as ProductRow[];
  const hasNextPage = rows.length > input.limit;
  const items = (hasNextPage ? rows.slice(0, input.limit) : rows).map(mapProductRow);

  return {
    items,
    nextPage: hasNextPage ? input.page + 1 : null,
  };
}

/**
 * Cria um produto no catálogo.
 *
 * O `id` é gerado com `nanoid` na camada de API (REST e tRPC); o fallback aqui
 * mantém a função segura para chamadas internas. `score` nasce `false` e os
 * timestamps são gravados nesta camada, como manda o contrato.
 */
export async function createProduct(input: CreateProductInput & { id?: string }): Promise<Product> {
  const now = new Date().toISOString();
  const description = input.description?.trim();

  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .insert({
      id: input.id ?? nanoid(),
      name: input.name.trim(),
      description: description ? description : null,
      image_url: input.imageUrl,
      external_link: input.externalLink,
      score: false,
      created_at: now,
      updated_at: now,
    })
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Falha ao criar o produto: ${error.message}`, { cause: error });
  }

  if (!data) {
    throw new Error("Falha ao criar o produto: nenhum registro retornado.");
  }

  return mapProductRow(data as unknown as ProductRow);
}

/**
 * Busca um produto por id para a página de detalhes.
 *
 * Sem `use cache`: a ficha precisa refletir alterações assim que possível.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar o produto: ${error.message}`, { cause: error });
  }

  return data ? mapProductRow(data as unknown as ProductRow) : null;
}
