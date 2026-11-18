import { initTRPC } from "@trpc/server";

/**
 * Contexto das procedures. Hoje vazio: o sign-up nao depende de sessao. Quando
 * existir login, e aqui que a sessao do usuario entra.
 */
export async function createTRPCContext() {
  return {};
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
