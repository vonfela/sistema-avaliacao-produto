import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthShell } from "../../_components/auth-shell";

export const metadata: Metadata = {
  title: "Conta criada",
  description: "Sua conta foi criada com sucesso.",
};

export default function SignUpSuccessPage() {
  return (
    <AuthShell>
      <div className="w-full">
        <div className="flex size-12 items-center justify-center rounded-full bg-signal text-white">
          <Check aria-hidden className="size-6" strokeWidth={2.5} />
        </div>

        <h1 className="mt-7 font-display text-[2.5rem] leading-[1.02] tracking-[-0.045em] text-balance sm:text-[2.75rem]">
          Conta criada.
        </h1>
        <p className="mt-4 max-w-[44ch] text-[0.9375rem] leading-7 text-pretty text-ink-soft">
          Seu cadastro está pronto. Agora você pode avaliar produtos, comparar opções e guardar o
          que vale a pena.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            asChild
            className="h-12 w-full rounded-sm bg-signal px-6 text-[0.9375rem] font-medium text-white hover:bg-signal/90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <Link href="/">Voltar ao início</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-11 w-full rounded-sm text-[0.875rem] text-ink-soft hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-signal"
          >
            <Link href="/auth/sign-up">Criar outra conta</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
