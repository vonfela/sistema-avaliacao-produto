import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "../_components/auth-shell";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta para avaliar, comparar e descobrir produtos.",
};

/**
 * Fallback estático enquanto o formulário resolve `useSearchParams` (o `next`
 * opcional vem da URL). Mantém a altura aproximada para evitar salto de layout.
 */
function SignInFormFallback() {
  return (
    <div className="w-full">
      <span role="status" className="sr-only">
        Carregando formulário…
      </span>

      <div aria-hidden>
        <div className="h-11 w-3/4 max-w-[22rem] animate-pulse rounded-sm bg-ink/10" />
        <div className="mt-5 h-4 w-full max-w-[34ch] animate-pulse rounded-sm bg-ink/5" />
        <div className="mt-9 flex flex-col gap-6">
          <div className="h-14 animate-pulse rounded-sm bg-ink/5" />
          <div className="h-14 animate-pulse rounded-sm bg-ink/5" />
          <div className="h-12 animate-pulse rounded-sm bg-signal/20" />
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <AuthShell>
      <Suspense fallback={<SignInFormFallback />}>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
