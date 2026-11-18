import { Check, Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

function Wordmark({ tone = "light" }: { tone?: Tone }) {
  return (
    <Link
      href="/"
      aria-label="prova, ir para o início"
      className={cn(
        "inline-flex items-baseline rounded-sm font-display text-[1.45rem] leading-none font-semibold tracking-[-0.045em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal",
        tone === "dark" ? "text-paper" : "text-ink",
      )}
    >
      prova
      <span
        aria-hidden
        className={cn("ml-0.5", tone === "dark" ? "text-signal-dark" : "text-signal")}
      >
        *
      </span>
    </Link>
  );
}

function Stars({ tone = "light" }: { tone?: Tone }) {
  return (
    <span
      role="img"
      aria-label="Nota 4,8 de 5"
      className={cn(
        "inline-flex items-center gap-0.5",
        tone === "dark" ? "text-signal-dark" : "text-signal",
      )}
    >
      {[0, 1, 2, 3].map((index) => (
        <Star key={index} aria-hidden className="size-3.5 fill-current" strokeWidth={0} />
      ))}
      <span aria-hidden className="relative inline-flex size-3.5">
        <Star
          aria-hidden
          className="absolute inset-0 size-3.5 fill-current opacity-25"
          strokeWidth={0}
        />
        <span className="absolute inset-y-0 left-0 w-4/5 overflow-hidden">
          <Star aria-hidden className="size-3.5 fill-current" strokeWidth={0} />
        </span>
      </span>
    </span>
  );
}

function ReviewCard() {
  return (
    <figure className="relative w-full max-w-[28rem] bg-paper-raised p-6 text-ink shadow-[8px_8px_0_0_var(--auth-signal-dark)] sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[0.8125rem] font-medium tracking-[-0.01em]">Cafeteira elétrica</span>
        <span className="border border-ink/15 px-2 py-1 text-[0.6875rem] leading-none text-ink-soft">
          Cozinha
        </span>
      </div>

      <blockquote className="mt-7 font-display text-[1.55rem] leading-[1.22] tracking-[-0.025em] text-balance sm:text-[1.7rem]">
        “Comprei por causa de uma avaliação daqui. Dois anos depois, ainda é o melhor gasto da minha
        cozinha.”
      </blockquote>

      <figcaption className="mt-8 border-t border-line pt-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-[0.6875rem] font-medium text-paper"
          >
            MS
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium">Marina S.</p>
            <p className="text-[0.75rem] text-ink-soft">Usa há 2 anos</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Stars />
            <span aria-hidden className="text-[0.8125rem] font-medium">
              4,8
            </span>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-[0.75rem] text-ink-soft">
          <Check aria-hidden className="size-3.5 text-signal" strokeWidth={2.5} />
          Avaliação verificada
        </p>
      </figcaption>
    </figure>
  );
}

function AuthAside() {
  return (
    <aside
      aria-label="Avaliação em destaque"
      className="relative hidden flex-col overflow-hidden bg-ink p-10 text-paper lg:flex xl:p-14"
    >
      <div aria-hidden className="auth-grid pointer-events-none absolute inset-0" />

      <div className="relative">
        <Wordmark tone="dark" />
      </div>

      <div className="relative flex flex-1 items-center py-12">
        <ReviewCard />
      </div>

      <div className="relative flex items-center gap-3 text-[0.75rem] leading-5 text-paper/65">
        <span aria-hidden className="h-px w-8 bg-paper/25" />
        <p>Sem patrocínio. Sem nota comprada.</p>
      </div>
    </aside>
  );
}

function MobileReview() {
  return (
    <section aria-label="Avaliação em destaque" className="bg-ink px-6 py-10 text-paper lg:hidden">
      <div className="mx-auto w-full max-w-[28.75rem]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Stars tone="dark" />
          <span aria-hidden className="text-[0.8125rem] font-medium">
            4,8
          </span>
          <span className="text-[0.75rem] text-paper/65">Cafeteira elétrica</span>
        </div>
        <blockquote className="mt-4 font-display text-[1.5rem] leading-[1.25] tracking-[-0.025em] text-balance">
          “Comprei por causa de uma avaliação daqui. Dois anos depois, ainda é o melhor gasto da
          minha cozinha.”
        </blockquote>
        <p className="mt-4 text-[0.75rem] text-paper/65">Marina S., usa há 2 anos</p>
      </div>
    </section>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell min-h-svh bg-paper text-ink">
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <AuthAside />

        <div className="flex min-h-svh min-w-0 flex-col">
          <header className="px-6 pt-6 lg:hidden">
            <div className="mx-auto w-full max-w-[28.75rem]">
              <Wordmark />
            </div>
          </header>

          <div className="flex flex-1 items-center px-6 py-10 sm:px-10 lg:px-10 lg:py-14 xl:px-20">
            <div className="mx-auto w-full max-w-[28.75rem]">{children}</div>
          </div>
        </div>
      </div>

      <MobileReview />
    </main>
  );
}
