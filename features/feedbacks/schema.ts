import { z } from "zod";

/**
 * Contrato compartilhado de avaliações de produto.
 *
 * O mesmo schema valida o formulário no cliente e a entrada no servidor, para
 * que as mensagens de erro e os limites sejam idênticos nos dois lados.
 */

export const MIN_FEEDBACK_SCORE = 1;
export const MAX_FEEDBACK_SCORE = 5;
export const MIN_FEEDBACK_COMMENT_LENGTH = 3;
export const MAX_FEEDBACK_COMMENT_LENGTH = 1000;

export type FeedbackAuthor = {
  firstName: string;
  lastName: string;
};

export type ProductFeedback = {
  id: string;
  score: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  productId: string;
  author: FeedbackAuthor | null;
};

export const feedbackInputSchema = z.object({
  score: z
    .number()
    .int("Escolha uma nota inteira de 1 a 5.")
    .min(MIN_FEEDBACK_SCORE, "Escolha uma nota de 1 a 5.")
    .max(MAX_FEEDBACK_SCORE, "Escolha uma nota de 1 a 5."),
  comment: z
    .string()
    .trim()
    .min(MIN_FEEDBACK_COMMENT_LENGTH, `Escreva ao menos ${MIN_FEEDBACK_COMMENT_LENGTH} caracteres.`)
    .max(MAX_FEEDBACK_COMMENT_LENGTH, `Use no máximo ${MAX_FEEDBACK_COMMENT_LENGTH} caracteres.`),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

/** Identificador do produto usado pelas procedures e pela rota REST. */
export const feedbackProductIdSchema = z.string().trim().min(1, "Informe o produto.");

export const feedbackMutationSchema = feedbackInputSchema.extend({
  productId: feedbackProductIdSchema,
});

export type FeedbackMutationInput = z.infer<typeof feedbackMutationSchema>;

/** Nome público do autor: primeiro nome + inicial do sobrenome. */
export function formatAuthorName(author: FeedbackAuthor | null): string {
  if (!author) return "Pessoa avaliadora";

  const firstName = author.firstName.trim();
  const lastNameInitial = author.lastName.trim().charAt(0).toUpperCase();

  if (!firstName) return "Pessoa avaliadora";
  if (!lastNameInitial) return firstName;

  return `${firstName} ${lastNameInitial}.`;
}
