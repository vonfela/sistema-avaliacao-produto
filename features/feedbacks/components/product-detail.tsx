import { notFound } from "next/navigation";
import { after } from "next/server";
import { AiSummaryCard } from "@/features/ai-summaries/components/ai-summary-card";
import type { ProductFeedback } from "@/features/feedbacks/schema";
import { getSummary, type ProductAiSummary } from "@/server/ai-summaries/repository";
import {
  isAiSummaryEnabled,
  isSummaryStale,
  refreshProductSummary,
} from "@/server/ai-summaries/service";
import { getSession } from "@/server/auth/session";
import { listFeedbacks } from "@/server/feedbacks/repository";
import { getProductById } from "@/server/products/repository";
import { FeedbackForm } from "./feedback-form";
import { FeedbackList } from "./feedback-list";
import { ProductHero } from "./product-hero";
import { SignInRequired } from "./sign-in-required";

function averageScore(feedbacks: ProductFeedback[]): number | null {
  if (feedbacks.length === 0) return null;

  const total = feedbacks.reduce((sum, feedback) => sum + feedback.score, 0);

  return total / feedbacks.length;
}

/**
 * Conteúdo dinâmico da página de produto: produto, avaliações e sessão são
 * resolvidos aqui, dentro do `<Suspense>` da página. Assim o shell estático
 * (breadcrumb, skeleton) não espera o banco nem o cookie.
 */
export async function ProductDetail({ productId }: { productId: string }) {
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const aiEnabled = isAiSummaryEnabled();

  const [feedbacksResult, session, summaryResult] = await Promise.all([
    listFeedbacks(productId).then(
      (items) => ({ items, failed: false as const }),
      (error: unknown) => {
        console.error(`[products/${productId}] falha ao carregar avaliações`, error);
        return { items: [] as ProductFeedback[], failed: true as const };
      },
    ),
    getSession(),
    aiEnabled
      ? getSummary(productId).then(
          (summary) => ({ summary, failed: false as const }),
          (error: unknown) => {
            console.error(`[products/${productId}] falha ao carregar o resumo por IA`, error);
            return { summary: null as ProductAiSummary | null, failed: true as const };
          },
        )
      : { summary: null as ProductAiSummary | null, failed: true as const },
  ]);

  const { items: feedbacks, failed: feedbacksFailed } = feedbacksResult;
  const average = feedbacksFailed ? null : averageScore(feedbacks);
  // Resumo por IA: só aparece com avaliações carregadas e leitura do resumo ok.
  // Se estiver faltando ou desatualizado, a geração roda depois da resposta.
  const showAiSummary = !feedbacksFailed && !summaryResult.failed && feedbacks.length > 0;
  const summaryStale =
    !feedbacksFailed && !summaryResult.failed && isSummaryStale(summaryResult.summary, feedbacks);

  if (summaryStale) {
    after(() => refreshProductSummary(productId));
  }

  const ownFeedback = session
    ? (feedbacks.find((feedback) => feedback.createdBy === session.id) ?? null)
    : null;

  return (
    <div className="bg-paper text-ink">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <ProductHero
          product={product}
          average={average}
          count={feedbacks.length}
          statsUnavailable={feedbacksFailed}
        />

        {showAiSummary ? (
          <AiSummaryCard
            summary={summaryResult.summary?.summary ?? null}
            summarizedCount={summaryResult.summary?.feedbackCount ?? 0}
            updating={summaryStale}
          />
        ) : null}

        <div className="mt-12 grid gap-12 border-t border-ink/15 pt-10 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-14">
          <FeedbackList feedbacks={feedbacks} failed={feedbacksFailed} />

          <aside aria-label="Sua avaliação" className="min-w-0 lg:sticky lg:top-24">
            {session ? (
              <FeedbackForm
                key={product.id}
                productId={product.id}
                initialFeedback={ownFeedback}
                authorName={session.firstName}
              />
            ) : (
              <SignInRequired productId={product.id} />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
