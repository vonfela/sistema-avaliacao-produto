import { TRPCError } from "@trpc/server";
import { NextResponse } from "next/server";
import { EMAIL_ALREADY_EXISTS_MESSAGE, signUpSchema } from "@/features/sign-up/schema";
import { createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";

/**
 * Contrato público do sign-up, conforme a spec:
 *   POST /api/v1/sign-up  ->  201 | 400
 *
 * Esta rota é um adaptador fino: não reimplementa regra de negócio, apenas
 * traduz HTTP <-> tRPC. A fonte de verdade continua sendo a mutation `signUp`.
 */

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Corpo da requisição inválido: envie um JSON." },
      { status: 400 },
    );
  }

  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Dados inválidos.",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const caller = appRouter.createCaller(await createTRPCContext());

  try {
    const account = await caller.signUp(parsed.data);

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof TRPCError) {
      if (error.code === "CONFLICT") {
        return NextResponse.json(
          { message: EMAIL_ALREADY_EXISTS_MESSAGE, issues: [{ field: "email" }] },
          { status: 409 },
        );
      }

      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    console.error("[POST /api/v1/sign-up] erro inesperado", error);

    return NextResponse.json({ message: "Não foi possível criar a conta." }, { status: 500 });
  }
}
