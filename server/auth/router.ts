import { TRPCError } from "@trpc/server";
import {
  INVALID_CREDENTIALS_MESSAGE,
  SIGN_IN_UNEXPECTED_ERROR_MESSAGE,
  signInSchema,
} from "@/features/sign-in/schema";
import { authenticateAccount } from "@/server/accounts/repository";
import { createSession, destroySession } from "@/server/auth/session";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/init";

/**
 * Procedures de autenticação para clientes tRPC tipados.
 *
 * A rota REST `/api/v1/sign-in` é a fonte de verdade do contrato HTTP, mas
 * reutiliza os mesmos serviços (`authenticateAccount` e `createSession`).
 */
export const authRouter = createTRPCRouter({
  signIn: publicProcedure.input(signInSchema).mutation(async ({ input }) => {
    try {
      const account = await authenticateAccount(input.email, input.password);

      if (!account) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: INVALID_CREDENTIALS_MESSAGE,
        });
      }

      await createSession(account.id);

      return { account };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error("[auth/signIn] erro inesperado", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: SIGN_IN_UNEXPECTED_ERROR_MESSAGE,
      });
    }
  }),

  signOut: publicProcedure.mutation(async () => {
    await destroySession();

    return { ok: true };
  }),
});
