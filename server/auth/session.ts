import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Sessão assinada em cookie, sem tabela de sessões.
 *
 * Formato do valor: `base64url(payload).base64url(hmacSha256(payload))`, com
 * payload `{ sub, iat, exp }`. A assinatura usa HMAC-SHA256 e comparação em
 * tempo constante. O cookie é HttpOnly, SameSite=Lax e dura 7 dias.
 */

export type SessionAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

type SessionAccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

const SESSION_COOKIE_NAME = "prova_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Segredo do HMAC. `AUTH_SESSION_SECRET` é o valor recomendado; enquanto ele
 * não estiver configurado, cai para a service role key do Supabase (que já é
 * um segredo exclusivo do servidor). Em produção, defina o segredo próprio.
 */
function getSessionSecret(): string {
  const secret =
    process.env.AUTH_SESSION_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!secret) {
    throw new Error(
      "Segredo de sessão ausente: defina AUTH_SESSION_SECRET (ou SUPABASE_SERVICE_ROLE_KEY como fallback).",
    );
  }

  return secret;
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
}

function serializeSession(payload: SessionPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.sub === "string" &&
    candidate.sub.length > 0 &&
    typeof candidate.iat === "number" &&
    Number.isFinite(candidate.iat) &&
    typeof candidate.exp === "number" &&
    Number.isFinite(candidate.exp)
  );
}

function parseSessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");

  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;

  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    if (!isSessionPayload(parsed)) return null;

    const now = Math.floor(Date.now() / 1000);

    if (parsed.exp <= now) return null;

    return parsed;
  } catch {
    return null;
  }
}

/** Cria o cookie de sessão para a conta informada. */
export async function createSession(accountId: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: accountId,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, serializeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Remove o cookie de sessão. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Lê e valida o cookie, depois confirma que a conta ainda existe e está ativa.
 *
 * Qualquer cookie ausente, adulterado, expirado ou de conta removida/inativa
 * resulta em `null` (visitante). Falhas do Supabase também degradam para
 * visitante para não derrubar o layout inteiro por causa do cabeçalho.
 */
export async function getSession(): Promise<SessionAccount | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = parseSessionToken(token);

  if (!payload) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("accounts")
    .select("id, first_name, last_name, email")
    .eq("id", payload.sub)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("[auth/session] falha ao carregar a conta da sessão", error);
    return null;
  }

  const account = data as SessionAccountRow | null;

  if (!account) return null;

  return {
    id: account.id,
    firstName: account.first_name,
    lastName: account.last_name,
    email: account.email,
  };
}
