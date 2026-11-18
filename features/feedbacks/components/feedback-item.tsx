import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatAuthorName, type ProductFeedback } from "@/features/feedbacks/schema";
import { StarRating } from "./star-rating";

function parseDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRelativeDate(value: string): string | null {
  const date = parseDate(value);

  if (!date) return null;

  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

function formatFullDate(value: string): string | undefined {
  const date = parseDate(value);

  if (!date) return undefined;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function getInitials(feedback: ProductFeedback): string {
  if (!feedback.author) return "?";

  const first = feedback.author.firstName.trim().charAt(0).toUpperCase();
  const last = feedback.author.lastName.trim().charAt(0).toUpperCase();

  return `${first}${last}` || "?";
}

export function FeedbackItem({ feedback }: { feedback: ProductFeedback }) {
  const relativeDate = formatRelativeDate(feedback.updatedAt);
  const fullDate = formatFullDate(feedback.updatedAt);

  return (
    <article className="border-t border-line py-6 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[0.6875rem] font-semibold tracking-wide text-paper"
        >
          {getInitials(feedback)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="max-w-full truncate text-[0.875rem] font-medium text-ink">
              {formatAuthorName(feedback.author)}
            </p>

            {relativeDate ? (
              <time
                dateTime={feedback.updatedAt}
                title={fullDate}
                className="text-[0.75rem] text-ink-soft"
              >
                {relativeDate}
              </time>
            ) : null}

            <span className="ml-auto inline-flex items-center gap-1.5">
              <StarRating score={feedback.score} size="sm" />
              <span className="text-[0.75rem] font-medium tabular-nums text-ink">
                {feedback.score}/5
              </span>
            </span>
          </div>

          <p className="mt-2.5 text-[0.9375rem] leading-7 break-words whitespace-pre-line text-ink/90">
            {feedback.comment}
          </p>
        </div>
      </div>
    </article>
  );
}
