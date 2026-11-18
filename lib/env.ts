import "server-only";

/**
 * Acesso as variaveis de ambiente do servidor.
 *
 * Fica propositalmente atras de funcoes (e nao de constantes de modulo) para
 * que o `next build` nao quebre quando as variaveis nao estiverem presentes no
 * momento da compilacao.
 */

type ServerEnv = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
};

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [
    !supabaseUrl && "SUPABASE_URL",
    !supabaseServiceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Variaveis de ambiente ausentes: ${missing.join(", ")}. Copie .env.example para .env.local e preencha os valores.`,
    );
  }

  cached = {
    supabaseUrl: supabaseUrl as string,
    supabaseServiceRoleKey: supabaseServiceRoleKey as string,
  };

  return cached;
}

/**
 * Chave da DeepSeek usada pelo agente de resumo (Mastra).
 *
 * Opcional: sem ela o resumo por IA fica desligado e a página segue normal.
 * `DEEPSEEK_API_KEY` é o nome que a Mastra procura para o provider `deepseek`.
 */
export function getDeepSeekApiKey(): string | null {
  const key = process.env.DEEPSEEK_API_KEY;
  return key?.trim() ? key.trim() : null;
}

/**
 * Chave do OpenRouter usada pelo modelo principal (gratuito) do agente de resumo.
 * `OPENROUTER_API_KEY` é o nome que a Mastra procura para o provider `openrouter`.
 */
export function getOpenRouterApiKey(): string | null {
  const key = process.env.OPENROUTER_API_KEY;
  return key?.trim() ? key.trim() : null;
}
