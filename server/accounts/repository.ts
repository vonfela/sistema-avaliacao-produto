import "server-only";

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { BCRYPT_ROUNDS, type SignUpInput } from "@/features/sign-up/schema";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type Account = {
  id: string;
  email: string;
};

/** Dados mínimos devolvidos para a sessão e para o cabeçalho. */
export type AuthenticatedAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type AccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  active: boolean;
};

/**
 * Hash bcrypt descartável usado quando o e-mail não existe.
 *
 * Comparar contra ele mantém o custo de `bcrypt.compare` mesmo no caminho de
 * falha, reduzindo a diferença de tempo entre "e-mail inexistente" e "senha
 * errada". O valor não corresponde a nenhuma conta real.
 */
const DUMMY_PASSWORD_HASH = "$2b$12$AS4wr3lV0QG9yVeC6lEuoeDYQrUKUtt43161OV.2i8OJicmcj3cBm";

/** Lancado quando o e-mail ja pertence a uma conta (violacao de unicidade). */
export class EmailAlreadyExistsError extends Error {
  constructor(readonly email: string) {
    super(`E-mail ja cadastrado: ${email}`);
    this.name = "EmailAlreadyExistsError";
  }
}

const UNIQUE_VIOLATION = "23505";

/**
 * Cria a conta na tabela `accounts`.
 *
 * O salt NAO e gerado a parte: ele nasce dentro do bcrypt e e lido de volta com
 * `getSalt`, de forma que a coluna `salt` guarde exatamente o salt embutido no
 * hash. Fonte unica de verdade, sem chance de divergirem.
 */
export async function createAccount(input: SignUpInput): Promise<Account> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const salt = bcrypt.getSalt(passwordHash);
  const now = new Date().toISOString();

  const { data, error } = await getSupabaseAdmin()
    .from("accounts")
    .insert({
      id: nanoid(),
      first_name: input.firstName,
      last_name: input.lastName,
      email,
      password: passwordHash,
      salt,
      active: true,
      created_at: now,
      updated_at: now,
    })
    .select("id, email")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new EmailAlreadyExistsError(email);
    }

    throw new Error(`Falha ao criar a conta: ${error.message}`, { cause: error });
  }

  if (!data) {
    throw new Error("Falha ao criar a conta: nenhum registro retornado.");
  }

  return data as Account;
}

/**
 * Valida e-mail e senha contra `accounts`.
 *
 * Retorna `null` para qualquer combinação inválida (e-mail inexistente, senha
 * errada ou conta inativa), sempre com o mesmo custo de bcrypt. Nunca revela
 * qual campo falhou e nunca registra a senha ou o hash.
 */
export async function authenticateAccount(
  email: string,
  password: string,
): Promise<AuthenticatedAccount | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await getSupabaseAdmin()
    .from("accounts")
    .select("id, first_name, last_name, email, password, active")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao autenticar a conta: ${error.message}`, { cause: error });
  }

  const account = data as AccountRow | null;

  if (!account) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, account.password);

  if (!account.active || !passwordMatches) {
    return null;
  }

  return {
    id: account.id,
    firstName: account.first_name,
    lastName: account.last_name,
    email: account.email,
  };
}
