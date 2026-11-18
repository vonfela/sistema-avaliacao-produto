import { ArrowDown } from "lucide-react";
import Link from "next/link";

/**
 * Cabeçalho editorial da home.
 *
 * O herói é só tipografia: a promessa do catálogo fica no título, o contexto no
 * parágrafo lateral e o único caminho oferecido é descer para a lista. Busca,
 * filtro e categorias estão fora do escopo desta entrega, então não há controle
 * nenhum aqui. O CTA aponta para `#catalogo`, que a página da home renderiza.
 */
export function HomeHero() {
  return (
    <section aria-labelledby="home-hero-titulo" className="border-b border-line bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-12 lg:px-8 lg:pt-24 lg:pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:gap-14">
          <h1
            id="home-hero-titulo"
            className="max-w-[18ch] font-display text-[2.5rem] leading-[0.98] tracking-[-0.05em] text-balance sm:max-w-[16ch] sm:text-[3.5rem] lg:max-w-none lg:text-[4.25rem]"
          >
            Avaliações de quem usou, não de quem vende.
          </h1>

          <div className="lg:border-l lg:border-line lg:pl-6">
            <p className="max-w-[46ch] text-[0.9375rem] leading-7 text-pretty text-ink-soft">
              O catálogo reúne fichas de produtos com as avaliações de quem já comprou. A nota e o
              comentário vêm de pessoas de verdade; a loja não escreve aqui.
            </p>

            <Link
              href="#catalogo"
              className="mt-5 inline-flex items-center gap-1.5 border-b border-ink/30 pb-1 text-[0.8125rem] font-medium text-ink transition-colors hover:border-signal hover:text-signal focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal motion-reduce:transition-none"
            >
              Ver o catálogo
              <ArrowDown aria-hidden className="size-3.5" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
