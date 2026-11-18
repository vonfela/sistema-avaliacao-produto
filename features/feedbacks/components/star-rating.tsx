import { Star } from "lucide-react";
import { MAX_FEEDBACK_SCORE } from "@/features/feedbacks/schema";
import { cn } from "@/lib/utils";

type StarSize = "sm" | "md" | "lg";

const STAR_SIZE: Record<StarSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

type StarRatingProps = {
  score: number;
  size?: StarSize;
  className?: string;
  label?: string;
};

function formatScore(score: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(score);
}

/**
 * Estrelas somente leitura, com preenchimento fracionado para a nota média.
 * A nota é anunciada uma única vez por `aria-label`; os ícones ficam ocultos.
 */
export function StarRating({ score, size = "md", className, label }: StarRatingProps) {
  const clamped = Math.min(MAX_FEEDBACK_SCORE, Math.max(0, score));
  const sizeClass = STAR_SIZE[size];

  return (
    <span
      role="img"
      aria-label={label ?? `Nota ${formatScore(clamped)} de 5`}
      className={cn("inline-flex items-center gap-0.5 text-signal", className)}
    >
      {Array.from({ length: MAX_FEEDBACK_SCORE }, (_, index) => index + 1).map((star) => {
        const fill = Math.min(1, Math.max(0, clamped - (star - 1)));

        return (
          <span key={star} aria-hidden className={cn("relative inline-flex shrink-0", sizeClass)}>
            <Star
              aria-hidden
              strokeWidth={0}
              className={cn("absolute inset-0 fill-current opacity-20", sizeClass)}
            />
            {fill > 0 ? (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star aria-hidden strokeWidth={0} className={cn("fill-current", sizeClass)} />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
