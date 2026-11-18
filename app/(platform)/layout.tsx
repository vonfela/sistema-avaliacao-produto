import type { ReactNode } from "react";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteHeaderSkeleton } from "@/components/site-header-skeleton";

/**
 * Layout base da plataforma: cabeçalho com sessão, conteúdo e rodapé.
 *
 * O grupo `(platform)` não muda a URL. As páginas `/auth/*` ficam fora dele e
 * continuam usando a `AuthShell` própria.
 *
 * `SiteHeader` lê cookies e fica sob `<Suspense>` para que o restante da rota
 * possa ser prerenderizado com Cache Components.
 */
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-paper text-ink">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-paper"
      >
        Pular para o conteúdo
      </a>

      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
