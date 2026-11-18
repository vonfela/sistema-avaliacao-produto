import { LoaderCircle, Sparkles } from "lucide-react";

type AiSummaryCardProps = {
  /** Texto salvo; `null` enquanto o primeiro resumo ainda está sendo gerado. */
  summary: string | null;
  /** Quantidade de avaliações que o resumo salvo cobre. */
  summarizedCount: number;
  /** O resumo salvo não reflete as avaliações atuais e já está sendo refeito. */
  updating: boolean;
};

/**
 * Bloco "Resumo por IA" da ficha do produto.
 *
 * O texto é renderizado como texto puro (nunca HTML/markdown): ele vem de um
 * modelo alimentado por comentários de usuários.
 */
export function AiSummaryCard({ summary, summarizedCount, updating }: AiSummaryCardProps) {
  return (
    <section
      aria-labelledby="ai-summary-heading"
      aria-busy={updating || summary === null}
      className="relative mt-12 lg:mt-16"
    >
      <div aria-hidden className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-signal/25" />

      <div className="relative border border-signal/40 bg-paper-raised p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="ai-summary-heading"
            className="inline-flex items-center gap-2 bg-signal px-2.5 py-1 text-[0.75rem] font-semibold tracking-wide text-paper uppercase"
          >
            <Sparkles aria-hidden className="size-3.5" strokeWidth={2} />
            Resumo por IA
          </h2>

          {updating && summary !== null ? (
            <p className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-soft">
              <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={1.8} />
              Atualizando com as avaliações mais recentes…
            </p>
          ) : null}
        </div>

        {summary !== null ? (
          <p className="mt-5 max-w-[72ch] font-display text-xl leading-[1.45] tracking-[-0.015em] break-words text-pretty text-ink sm:text-[1.375rem]">
            {summary}
          </p>
        ) : (
          <div className="mt-5 flex items-center gap-3 text-[0.9375rem] text-ink-soft">
            <LoaderCircle
              aria-hidden
              className="size-4 animate-spin text-signal"
              strokeWidth={1.8}
            />
            Gerando o resumo das avaliações. Recarregue a página em alguns segundos.
          </div>
        )}

        <p className="mt-6 border-t border-line pt-4 text-[0.75rem] leading-5 text-ink-soft">
          {summary !== null
            ? `Gerado automaticamente a partir de ${
                summarizedCount === 1 ? "1 avaliação" : `${summarizedCount} avaliações`
              }. Pode conter imprecisões; confira as avaliações abaixo.`
            : "O resumo é gerado automaticamente por IA e pode conter imprecisões."}
        </p>
      </div>
    </section>
  );
}
