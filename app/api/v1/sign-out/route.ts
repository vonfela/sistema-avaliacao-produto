import { NextResponse } from "next/server";
import { destroySession } from "@/server/auth/session";

/**
 * Contrato público do sign-out:
 *   POST /api/v1/sign-out  ->  204
 *
 * Apaga o cookie de sessão. Idempotente: sair sem sessão também retorna 204.
 */
export async function POST() {
  await destroySession();

  return new NextResponse(null, { status: 204 });
}
