import Link from "next/link";

/** Rodapé editorial da plataforma, compartilhado pelas páginas do grupo. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <Link
            href="/"
            aria-label="prova, ir para o início"
            className="inline-flex items-baseline rounded-sm font-display text-[1.2rem] leading-none font-semibold tracking-[-0.045em] text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
          >
            prova
            <span aria-hidden className="ml-0.5 text-signal">
              *
            </span>
          </Link>
          <p className="mt-2 max-w-[42ch] text-[0.8125rem] leading-6 text-ink-soft">
            Avaliações de pessoas reais, sem patrocínio e sem nota comprada.
          </p>
        </div>

        <p className="text-[0.75rem] leading-5 text-ink-soft">© 2026 prova*</p>
      </div>
    </footer>
  );
}
