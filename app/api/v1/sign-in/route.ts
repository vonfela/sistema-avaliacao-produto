import { NextResponse } from "next/server";
import {
  INVALID_CREDENTIALS_MESSAGE,
  SIGN_IN_UNEXPECTED_ERROR_MESSAGE,
  signInSchema,
} from "@/features/sign-in/schema";
import { authenticateAccount } from "@/server/accounts/repository";
import { createSession } from "@/server/auth/session";

/**
 * Contrato público do sign-in:
 *   POST /api/v1/sign-in  ->  200 | 400 | 401 | 500
 *
 * A rota é a fonte de verdade do contrato HTTP. Ela valida o corpo, autentica
 * a conta e define o cookie de sessão diretamente.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "Dados inválidos.",
        issues: [{ field: "body", message: "Envie um JSON válido." }],
      },
      { status: 400 },
    );
  }

  const parsed = signInSchema.safeParse(body);

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

  try {
    const account = await authenticateAccount(parsed.data.email, parsed.data.password);

    if (!account) {
      return NextResponse.json({ message: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
    }

    await createSession(account.id);

    return NextResponse.json({ account }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/v1/sign-in] erro inesperado", error);

    return NextResponse.json({ message: SIGN_IN_UNEXPECTED_ERROR_MESSAGE }, { status: 500 });
  }
}
