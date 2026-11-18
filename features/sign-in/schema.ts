import { z } from "zod";
import { MAX_PASSWORD_BYTES, passwordByteLength } from "@/features/sign-up/schema";

/**
 * Contrato compartilhado do sign-in: cliente (validação do formulário) e
 * servidor (validação da requisição) usam o mesmo schema.
 *
 * A senha não tem mínimo de tamanho aqui: quem define isso é o cadastro. No
 * login só importa que ela exista e caiba no limite físico do bcrypt.
 */
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .max(254, "E-mail muito longo.")
    .pipe(z.email("Informe um e-mail válido.")),
  password: z
    .string()
    .min(1, "Informe sua senha.")
    .refine(
      (value) => passwordByteLength(value) <= MAX_PASSWORD_BYTES,
      `A senha excede o limite de ${MAX_PASSWORD_BYTES} bytes.`,
    ),
});

export type SignInInput = z.infer<typeof signInSchema>;

/** Mensagem única para e-mail inexistente, senha errada ou conta inativa. */
export const INVALID_CREDENTIALS_MESSAGE = "Email ou senha inválidos.";

/** Mensagem exibida quando algo inesperado acontece no servidor. */
export const SIGN_IN_UNEXPECTED_ERROR_MESSAGE =
  "Não foi possível entrar. Tente novamente em instantes.";
