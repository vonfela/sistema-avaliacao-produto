/**
 * Fallback do `SiteHeader` enquanto a sessão é lida no servidor.
 *
 * Mantém a marca e a altura do cabeçalho para que a troca pelo conteúdo real
 * não desloque a página.
 */
export function SiteHeaderSkeleton() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <span className="font-display text-[1.45rem] leading-none font-semibold tracking-[-0.045em] text-ink">
          prova
          <span aria-hidden className="ml-0.5 text-signal">
            *
          </span>
        </span>

        <div
          aria-hidden
          className="h-9 w-40 animate-pulse rounded-sm bg-ink/10 motion-reduce:animate-none"
        />

        <span role="status" className="sr-only">
          Carregando sua sessão…
        </span>
      </div>
    </header>
  );
}
