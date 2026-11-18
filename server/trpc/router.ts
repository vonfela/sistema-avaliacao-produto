import { TRPCError } from "@trpc/server";
import { EMAIL_ALREADY_EXISTS_MESSAGE, signUpSchema } from "@/features/sign-up/schema";
import { createAccount, EmailAlreadyExistsError } from "@/server/accounts/repository";
import { authRouter } from "@/server/auth/router";
import { feedbacksRouter } from "@/server/feedbacks/router";
import { productsRouter } from "@/server/products/router";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/init";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  products: productsRouter,
  feedbacks: feedbacksRouter,
  signUp: publicProcedure.input(signUpSchema).mutation(async ({ input }) => {
    try {
      return await createAccount(input);
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        throw new TRPCError({
          code: "CONFLICT",
          message: EMAIL_ALREADY_EXISTS_MESSAGE,
        });
      }

      console.error("[sign-up] falha inesperada ao criar conta", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível criar a conta. Tente novamente em instantes.",
      });
    }
  }),
});

export type AppRouter = typeof appRouter;
