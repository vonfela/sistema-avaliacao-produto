import { LockKeyhole } from "lucide-react";
import Link from "next/link";

export function SignInRequired({ productId }: { productId: string }) {
  const next = encodeURIComponent(`/products/${productId}`);

  return (
    <div className="border border-ink/15 bg-paper-raised p-6 sm:p-7">
      <span className="flex size-11 items-center justify-center rounded-full bg-ink text-paper">
        <LockKeyhole aria-hidden className="size-5" strokeWidth={1.7} />
      </span>

      <h2 className="mt-5 font-display text-2xl leading-tight tracking-[-0.035em] text-balance">
        Entre para avaliar este produto
      </h2>

      <p className="mt-3 text-[0.875rem] leading-6 text-ink-soft">
        Sua conta garante que cada nota venha de uma pessoa real. Leva menos de um minuto para
        entrar.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <Link
          href={`/auth/sign-in?next=${next}`}
          className="inline-flex h-11 items-center justify-center bg-signal px-5 text-[0.875rem] font-medium text-white transition-colors hover:bg-signal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          Entrar na minha conta
        </Link>

        <Link
          href="/auth/sign-up"
          className="inline-flex h-11 items-center justify-center border border-ink/25 px-5 text-[0.875rem] font-medium text-ink transition-colors hover:border-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          Criar conta
        </Link>
      </div>

      <p className="mt-5 border-t border-line pt-4 text-[0.75rem] leading-5 text-ink-soft">
        Você pode ler todas as avaliações sem entrar.
      </p>
    </div>
  );
}
