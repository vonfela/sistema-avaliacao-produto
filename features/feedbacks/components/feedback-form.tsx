"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  type FeedbackInput,
  feedbackInputSchema,
  MAX_FEEDBACK_COMMENT_LENGTH,
  MIN_FEEDBACK_COMMENT_LENGTH,
  type ProductFeedback,
} from "@/features/feedbacks/schema";
import { trpc } from "@/lib/trpc/provider";
import { cn } from "@/lib/utils";
import { StarRatingInput } from "./star-rating-input";

type FeedbackFormProps = {
  productId: string;
  initialFeedback: ProductFeedback | null;
  authorName: string;
};

export function FeedbackForm({ productId, initialFeedback, authorName }: FeedbackFormProps) {
  const router = useRouter();
  const [hasExisting, setHasExisting] = useState(Boolean(initialFeedback));
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);
  const wasExistingRef = useRef(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackInputSchema),
    defaultValues: {
      score: initialFeedback?.score ?? 0,
      comment: initialFeedback?.comment ?? "",
    },
    mode: "onTouched",
  });

  const comment = watch("comment") ?? "";
  const commentLength = comment.length;

  const upsert = trpc.feedbacks.upsert.useMutation({
    onSuccess: ({ feedback }) => {
      setFormError(null);
      setHasExisting(true);
      setFeedbackMessage(wasExistingRef.current ? "Avaliação atualizada." : "Avaliação publicada.");
      reset({ score: feedback.score, comment: feedback.comment });
      router.refresh();
    },
    onError: (error) => {
      setFeedbackMessage(null);
      setFormError(error.message);
    },
  });

  useEffect(() => {
    if (formError) {
      formErrorRef.current?.focus();
    }
  }, [formError]);

  const onSubmit = handleSubmit((values) => {
    wasExistingRef.current = hasExisting;
    setFeedbackMessage(null);
    setFormError(null);
    upsert.mutate({ productId, score: values.score, comment: values.comment });
  });

  const commentError = errors.comment?.message;
  const scoreError = errors.score?.message;
  const commentHintId = commentError ? undefined : "feedback-comment-hint";
  const commentErrorId = commentError ? "feedback-comment-error" : undefined;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="border border-ink/15 bg-paper-raised p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl leading-tight tracking-[-0.035em]">
          {hasExisting ? "Sua avaliação" : "Avalie este produto"}
        </h2>
        {hasExisting ? (
          <span className="shrink-0 border border-signal/30 bg-signal/5 px-2 py-1 text-[0.6875rem] leading-none font-medium text-signal">
            Publicada
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-[0.875rem] leading-6 text-ink-soft">
        {hasExisting
          ? `${authorName}, você já avaliou este produto. Uma nova avaliação substitui a anterior.`
          : `${authorName}, conte o que funcionou e o que não funcionou na prática.`}
      </p>

      {formError ? (
        <div
          ref={formErrorRef}
          role="alert"
          tabIndex={-1}
          className="mt-5 flex gap-3 border-l-2 border-destructive bg-destructive/5 px-3 py-2.5 outline-none"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-[0.8125rem] leading-5 text-destructive">{formError}</p>
        </div>
      ) : null}

      {feedbackMessage ? (
        <div
          role="status"
          className="mt-5 flex gap-3 border-l-2 border-signal bg-signal/5 px-3 py-2.5"
        >
          <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-signal" />
          <p className="text-[0.8125rem] leading-5 text-ink">{feedbackMessage}</p>
        </div>
      ) : null}

      <div className="mt-6">
        <Controller
          control={control}
          name="score"
          render={({ field }) => (
            <StarRatingInput
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={upsert.isPending}
              error={Boolean(scoreError)}
              describedBy={scoreError ? "feedback-score-error" : undefined}
            />
          )}
        />
        {scoreError ? (
          <p
            id="feedback-score-error"
            role="alert"
            className="mt-2 text-[0.75rem] text-destructive"
          >
            {scoreError}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="feedback-comment" className="text-[0.8125rem] font-medium text-ink">
            Comentário
          </label>
          <span aria-hidden className="text-[0.75rem] tabular-nums text-ink-soft">
            {commentLength}/{MAX_FEEDBACK_COMMENT_LENGTH}
          </span>
        </div>

        <Textarea
          id="feedback-comment"
          {...register("comment")}
          rows={5}
          maxLength={MAX_FEEDBACK_COMMENT_LENGTH}
          placeholder="O que você achou na prática?"
          disabled={upsert.isPending}
          aria-invalid={Boolean(commentError)}
          aria-describedby={[commentHintId, commentErrorId].filter(Boolean).join(" ") || undefined}
          className={cn(
            "mt-2 min-h-32 resize-y rounded-none border-ink/25 bg-transparent px-3 py-2.5 text-[0.9375rem] leading-6 placeholder:text-ink-soft/55 focus-visible:border-signal focus-visible:ring-2 focus-visible:ring-signal/25",
            commentError && "border-destructive focus-visible:border-destructive",
          )}
        />

        {commentError ? (
          <p
            id="feedback-comment-error"
            role="alert"
            className="mt-2 text-[0.75rem] leading-5 text-destructive"
          >
            {commentError}
          </p>
        ) : (
          <p id="feedback-comment-hint" className="mt-2 text-[0.75rem] leading-5 text-ink-soft">
            De {MIN_FEEDBACK_COMMENT_LENGTH} a {MAX_FEEDBACK_COMMENT_LENGTH} caracteres.
          </p>
        )}
      </div>

      {hasExisting ? (
        <p className="mt-4 border-l-2 border-signal bg-signal/5 px-3 py-2 text-[0.75rem] leading-5 text-ink-soft">
          Ao enviar, sua avaliação anterior será substituída por esta.
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={upsert.isPending}
        aria-busy={upsert.isPending}
        className="mt-6 h-11 w-full rounded-none bg-signal px-5 text-[0.875rem] font-medium text-white hover:bg-signal/90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised disabled:opacity-60"
      >
        {upsert.isPending ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            Salvando…
          </>
        ) : hasExisting ? (
          "Atualizar avaliação"
        ) : (
          "Publicar avaliação"
        )}
      </Button>

      <p className="mt-3 text-center text-[0.6875rem] leading-5 text-ink-soft">
        Sua avaliação fica pública com seu primeiro nome e a inicial do sobrenome.
      </p>
    </form>
  );
}
