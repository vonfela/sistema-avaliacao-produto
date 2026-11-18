import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Acesso a `products_ai_summaries`.
 *
 * RLS ligado e sem policies: tudo passa pelo cliente com service role.
 */

export type ProductAiSummary = {
  productId: string;
  summary: string;
  feedbackCount: number;
  feedbacksUpdatedAt: string;
  model: string;
  generatedAt: string;
};

type SummaryRow = {
  product_id: string;
  summary: string;
  feedback_count: number;
  feedbacks_updated_at: string;
  model: string;
  generated_at: string;
};

const SUMMARY_COLUMNS =
  "product_id, summary, feedback_count, feedbacks_updated_at, model, generated_at";

function toSummary(row: SummaryRow): ProductAiSummary {
  return {
    productId: row.product_id,
    summary: row.summary,
    feedbackCount: row.feedback_count,
    feedbacksUpdatedAt: new Date(row.feedbacks_updated_at).toISOString(),
    model: row.model,
    generatedAt: new Date(row.generated_at).toISOString(),
  };
}

export async function getSummary(productId: string): Promise<ProductAiSummary | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products_ai_summaries")
    .select(SUMMARY_COLUMNS)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar o resumo: ${error.message}`, { cause: error });
  }

  return data ? toSummary(data as unknown as SummaryRow) : null;
}

export async function upsertSummary(input: Omit<ProductAiSummary, "generatedAt">): Promise<void> {
  const { error } = await getSupabaseAdmin().from("products_ai_summaries").upsert(
    {
      product_id: input.productId,
      summary: input.summary,
      feedback_count: input.feedbackCount,
      feedbacks_updated_at: input.feedbacksUpdatedAt,
      model: input.model,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" },
  );

  if (error) {
    throw new Error(`Falha ao salvar o resumo: ${error.message}`, { cause: error });
  }
}

export async function deleteSummary(productId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("products_ai_summaries")
    .delete()
    .eq("product_id", productId);

  if (error) {
    throw new Error(`Falha ao apagar o resumo: ${error.message}`, { cause: error });
  }
}
