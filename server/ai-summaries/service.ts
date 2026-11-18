import "server-only";

import type { ProductFeedback } from "@/features/feedbacks/schema";
import { mastra } from "@/mastra";
import {
  FALLBACK_SUMMARY_MODEL,
  PRIMARY_SUMMARY_MODEL,
  productSummaryModels,
} from "@/mastra/agents/product-summary-agent";
import {
  deleteSummary,
  type ProductAiSummary,
  upsertSummary,
} from "@/server/ai-summaries/repository";
import { listFeedbacks } from "@/server/feedbacks/repository";
import { getProductById } from "@/server/products/repository";

/** Limite de avaliações enviadas ao modelo, para manter custo e latência previsíveis. */
const MAX_FEEDBACKS_IN_PROMPT = 100;
const MAX_SUMMARY_LENGTH = 2000;

export function isAiSummaryEnabled(): boolean {
  return productSummaryModels().length > 0;
}

type FeedbacksSignature = { count: number; latestUpdatedAt: string };

/** "Assinatura" das avaliações: muda sempre que uma avaliação é criada, trocada ou apagada. */
export function feedbacksSignature(feedbacks: ProductFeedback[]): FeedbacksSignature | null {
  if (feedbacks.length === 0) return null;

  const latest = Math.max(...feedbacks.map((feedback) => new Date(feedback.updatedAt).getTime()));

  return { count: feedbacks.length, latestUpdatedAt: new Date(latest).toISOString() };
}

/** O resumo salvo precisa ser (re)gerado para refletir as avaliações atuais? */
export function isSummaryStale(
  summary: ProductAiSummary | null,
  feedbacks: ProductFeedback[],
): boolean {
  const signature = feedbacksSignature(feedbacks);

  if (!signature) return summary !== null;
  if (!summary) return true;

  return (
    summary.feedbackCount !== signature.count ||
    summary.feedbacksUpdatedAt !== signature.latestUpdatedAt
  );
}

function buildPrompt(productName: string, feedbacks: ProductFeedback[]): string {
  // Sem autor nem ids: só nota e comentário vão para o provedor de IA.
  const lines = feedbacks
    .slice(0, MAX_FEEDBACKS_IN_PROMPT)
    .map((feedback, index) => `${index + 1}. Nota ${feedback.score}/5 — ${feedback.comment}`);

  return [
    `Produto: ${productName}`,
    `Total de avaliações: ${feedbacks.length}`,
    "",
    "<avaliacoes>",
    ...lines,
    "</avaliacoes>",
    "",
    "Escreva o resumo geral dessas avaliações.",
  ].join("\n");
}

/** Converte o `modelId` devolvido pelo provedor no id completo usado na Mastra. */
function resolveModelLabel(modelId: string | undefined): string {
  if (!modelId) return "desconhecido";

  for (const candidate of [PRIMARY_SUMMARY_MODEL, FALLBACK_SUMMARY_MODEL]) {
    if (candidate.endsWith(`/${modelId}`)) return candidate;
  }

  return modelId;
}

/**
 * Regenera (ou apaga) o resumo do produto a partir das avaliações atuais.
 *
 * Feita para rodar dentro de `after()`: nunca lança erro, só registra no log.
 */
export async function refreshProductSummary(productId: string): Promise<void> {
  if (!isAiSummaryEnabled()) return;

  try {
    const product = await getProductById(productId);
    if (!product) return;

    const feedbacks = await listFeedbacks(productId);
    const signature = feedbacksSignature(feedbacks);

    if (!signature) {
      await deleteSummary(productId);
      return;
    }

    const agent = mastra.getAgentById("product-summary-agent");
    const response = await agent.generate(buildPrompt(product.name, feedbacks), {
      modelSettings: { temperature: 0.3, maxOutputTokens: 400 },
    });

    const summary = response.text.trim().slice(0, MAX_SUMMARY_LENGTH);

    if (!summary) {
      console.warn(`[ai-summary] resposta vazia para o produto ${productId}`);
      return;
    }

    await upsertSummary({
      productId,
      summary,
      feedbackCount: signature.count,
      feedbacksUpdatedAt: signature.latestUpdatedAt,
      model: resolveModelLabel(response.response?.modelId),
    });
  } catch (error) {
    console.error(`[ai-summary] falha ao gerar o resumo do produto ${productId}`, error);
  }
}
