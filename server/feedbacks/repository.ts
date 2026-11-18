import "server-only";

import { nanoid } from "nanoid";
import type { ProductFeedback } from "@/features/feedbacks/schema";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Acesso a `products_feedbacks`.
 *
 * A tabela tem RLS ligado e nenhuma policy: toda leitura/escrita passa pelo
 * cliente com service role, que vive apenas no servidor.
 */

const FEEDBACK_COLUMNS =
  "id, score, comment, created_at, updated_at, created_by, product_id, accounts(first_name, last_name)";

const UNIQUE_VIOLATION = "23505";

type AccountEmbed = {
  first_name: string | null;
  last_name: string | null;
};

type FeedbackRow = {
  id: string;
  score: number;
  comment: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  product_id: string;
  accounts: AccountEmbed | AccountEmbed[] | null;
};

export type UpsertFeedbackInput = {
  productId: string;
  createdBy: string;
  score: number;
  comment: string;
};

function normalizeAccount(value: FeedbackRow["accounts"]): AccountEmbed | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toProductFeedback(row: FeedbackRow): ProductFeedback {
  const account = normalizeAccount(row.accounts);

  return {
    id: row.id,
    score: row.score,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    productId: row.product_id,
    author: account
      ? {
          firstName: account.first_name ?? "",
          lastName: account.last_name ?? "",
        }
      : null,
  };
}

async function findFeedbackId(productId: string, createdBy: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products_feedbacks")
    .select("id")
    .eq("product_id", productId)
    .eq("created_by", createdBy)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar a avaliação: ${error.message}`, { cause: error });
  }

  return (data as { id: string } | null)?.id ?? null;
}

async function updateFeedback(input: UpsertFeedbackInput): Promise<ProductFeedback> {
  const { data, error } = await getSupabaseAdmin()
    .from("products_feedbacks")
    .update({
      score: input.score,
      comment: input.comment,
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", input.productId)
    .eq("created_by", input.createdBy)
    .select(FEEDBACK_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao atualizar a avaliação: ${error.message}`, { cause: error });
  }

  if (!data) {
    throw new Error("Falha ao atualizar a avaliação: registro não encontrado.");
  }

  return toProductFeedback(data as unknown as FeedbackRow);
}

/** Lista as avaliações do produto, da mais recente para a mais antiga. */
export async function listFeedbacks(productId: string): Promise<ProductFeedback[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("products_feedbacks")
    .select(FEEDBACK_COLUMNS)
    .eq("product_id", productId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao listar as avaliações: ${error.message}`, { cause: error });
  }

  return ((data ?? []) as unknown as FeedbackRow[]).map(toProductFeedback);
}

/**
 * Cria ou substitui a avaliação da pessoa para o produto.
 *
 * Cada conta tem no máximo uma avaliação por produto (unique constraint). O
 * caminho normal procura a linha existente antes de decidir entre update e
 * insert; se duas submissões correrem juntas, o insert perde para a constraint
 * `23505` e a segunda tentativa atualiza a linha vencedora.
 */
export async function upsertFeedback(input: UpsertFeedbackInput): Promise<ProductFeedback> {
  const existingId = await findFeedbackId(input.productId, input.createdBy);

  if (existingId) {
    return updateFeedback(input);
  }

  const now = new Date().toISOString();

  const { data, error } = await getSupabaseAdmin()
    .from("products_feedbacks")
    .insert({
      id: nanoid(),
      score: input.score,
      comment: input.comment,
      created_at: now,
      updated_at: now,
      created_by: input.createdBy,
      product_id: input.productId,
    })
    .select(FEEDBACK_COLUMNS)
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return updateFeedback(input);
    }

    throw new Error(`Falha ao salvar a avaliação: ${error.message}`, { cause: error });
  }

  if (!data) {
    throw new Error("Falha ao salvar a avaliação: nenhum registro retornado.");
  }

  return toProductFeedback(data as unknown as FeedbackRow);
}
