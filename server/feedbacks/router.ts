import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  feedbackMutationSchema,
  feedbackProductIdSchema,
  type ProductFeedback,
} from "@/features/feedbacks/schema";
import { getSession } from "@/server/auth/session";
import { listFeedbacks, upsertFeedback } from "@/server/feedbacks/repository";
import { getProductById } from "@/server/products/repository";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/init";

const PRODUCT_NOT_FOUND_MESSAGE = "Produto não encontrado.";
const UNAUTHORIZED_MESSAGE = "Você precisa entrar para avaliar este produto.";

export const feedbacksRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ productId: feedbackProductIdSchema }))
    .query(async ({ input }): Promise<{ items: ProductFeedback[] }> => {
      const product = await getProductById(input.productId);

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: PRODUCT_NOT_FOUND_MESSAGE });
      }

      return { items: await listFeedbacks(input.productId) };
    }),

  upsert: publicProcedure
    .input(feedbackMutationSchema)
    .mutation(async ({ input }): Promise<{ feedback: ProductFeedback }> => {
      const session = await getSession();

      if (!session) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHORIZED_MESSAGE });
      }

      const product = await getProductById(input.productId);

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: PRODUCT_NOT_FOUND_MESSAGE });
      }

      const feedback = await upsertFeedback({
        productId: input.productId,
        createdBy: session.id,
        score: input.score,
        comment: input.comment,
      });

      return { feedback };
    }),
});
