import { z } from "zod";

/**
 * Limite físico do bcrypt: a entrada é truncada em 72 bytes (UTF-8).
 * Caracteres acentuados podem ocupar até 4 bytes, por isso medimos bytes e não
 * o tamanho da string.
 */
export const MAX_PASSWORD_BYTES = 72;

export const MIN_PASSWORD_LENGTH = 8;

/** Custo do bcrypt. 12 é o piso recomendado atualmente. */
export const BCRYPT_ROUNDS = 12;

export const passwordByteLength = (value: string): number => new TextEncoder().encode(value).length;

/**
 * Schema único, compartilhado entre cliente (validação do formulário) e
 * servidor (validação da requisição). Sem transformações, para que o tipo de
 * entrada e de saída sejam idênticos e o react-hook-form não precise de
 * ginástica de tipos.
 */
export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Informe ao menos 2 caracteres.")
      .max(50, "Máximo de 50 caracteres."),
    lastName: z
      .string()
      .trim()
      .min(2, "Informe ao menos 2 caracteres.")
      .max(50, "Máximo de 50 caracteres."),
    email: z
      .string()
      .trim()
      .min(1, "Informe seu e-mail.")
      .max(254, "E-mail muito longo.")
      .pipe(z.email("Informe um e-mail válido.")),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `A senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      .refine(
        (value) => passwordByteLength(value) <= MAX_PASSWORD_BYTES,
        `A senha excede o limite de ${MAX_PASSWORD_BYTES} bytes.`,
      ),
    confirmPassword: z.string().min(1, "Confirme a sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

/** Mensagem exibida quando o e-mail informado já possui uma conta. */
export const EMAIL_ALREADY_EXISTS_MESSAGE =
  "Este e-mail já está cadastrado. Use outro e-mail ou faça login.";
