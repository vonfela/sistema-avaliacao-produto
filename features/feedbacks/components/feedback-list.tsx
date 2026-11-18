import { CircleAlert, MessageSquareQuote } from "lucide-react";
import type { ProductFeedback } from "@/features/feedbacks/schema";
import { FeedbackItem } from "./feedback-item";

function countLabel(count: number, failed: boolean): string {
  if (failed) return "Indisponível";
  if (count === 0) return "Nenhuma ainda";
  if (count === 1) return "1 avaliação";
  return `${count} avaliações`;
}

type FeedbackListProps = {
  feedbacks: ProductFeedback[];
  failed?: boolean;
};

export function FeedbackList({ feedbacks, failed = false }: FeedbackListProps) {
  return (
    <section aria-labelledby="reviews-heading" className="min-w-0">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink/20 pb-4">
        <h2 id="reviews-heading" className="font-display text-2xl tracking-[-0.035em] sm:text-3xl">
          Avaliações
        </h2>
        <p className="text-[0.8125rem] text-ink-soft">{countLabel(feedbacks.length, failed)}</p>
      </div>

      {failed ? (
        <div
          role="alert"
          className="mt-8 flex max-w-md flex-col items-start gap-3 border border-destructive/30 bg-destructive/5 p-6"
        >
          <CircleAlert aria-hidden className="size-6 text-destructive" strokeWidth={1.6} />
          <p className="font-display text-xl tracking-[-0.025em]">
            Não foi possível carregar as avaliações.
          </p>
          <p className="text-[0.875rem] leading-6 text-ink-soft">
            Recarregue a página para tentar de novo.
          </p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="mt-8 flex max-w-md flex-col items-start gap-3 border border-dashed border-line bg-paper-raised/60 p-6">
          <MessageSquareQuote aria-hidden className="size-6 text-signal" strokeWidth={1.6} />
          <p className="font-display text-xl tracking-[-0.025em]">Nenhuma avaliação por aqui.</p>
          <p className="text-[0.875rem] leading-6 text-ink-soft">
            Quem já testou ainda não contou. Sua avaliação pode ser a primeira.
          </p>
        </div>
      ) : (
        <div className="mt-2">
          {feedbacks.map((feedback) => (
            <FeedbackItem key={feedback.id} feedback={feedback} />
          ))}
        </div>
      )}
    </section>
  );
}
