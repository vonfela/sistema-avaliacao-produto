"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { MAX_FEEDBACK_SCORE } from "@/features/feedbacks/schema";
import { cn } from "@/lib/utils";

const SCORES = Array.from({ length: MAX_FEEDBACK_SCORE }, (_, index) => index + 1);

type StarRatingInputProps = {
  name: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
  describedBy?: string;
};

/**
 * Radio group nativo (fieldset + legend): teclado, leitor de tela e formulários
 * funcionam sem JavaScript extra. O preenchimento acompanha o hover para dar
 * prévia da nota antes do clique.
 */
export function StarRatingInput({
  name,
  value,
  onChange,
  onBlur,
  disabled,
  error,
  describedBy,
}: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? value;

  return (
    <fieldset
      disabled={disabled}
      aria-describedby={describedBy}
      onMouseLeave={() => setHovered(null)}
      className="min-w-0"
    >
      <legend className="text-[0.8125rem] font-medium text-ink">Sua nota</legend>

      <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-2">
        {SCORES.map((score) => {
          const filled = score <= active;

          return (
            <label
              key={score}
              onMouseEnter={() => setHovered(score)}
              className={cn(
                "relative cursor-pointer rounded-sm p-0.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-signal",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name={name}
                value={score}
                checked={value === score}
                disabled={disabled}
                onChange={() => onChange(score)}
                onBlur={() => {
                  setHovered(null);
                  onBlur?.();
                }}
                aria-invalid={error || undefined}
                className="peer sr-only"
              />
              <Star
                aria-hidden
                strokeWidth={1.4}
                className={cn(
                  "size-8 transition-[color,fill] duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal",
                  filled ? "fill-signal text-signal" : "fill-transparent text-ink/25",
                )}
              />
              <span className="sr-only">
                {score} de {MAX_FEEDBACK_SCORE}
              </span>
            </label>
          );
        })}

        <span
          aria-hidden
          className={cn(
            "ml-1.5 text-[0.8125rem] tabular-nums",
            value > 0 ? "font-medium text-ink" : "text-ink-soft",
          )}
        >
          {value > 0 ? `${value} de ${MAX_FEEDBACK_SCORE}` : "Sem nota"}
        </span>
      </div>
    </fieldset>
  );
}
