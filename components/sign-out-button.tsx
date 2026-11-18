"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Encerra a sessão via REST e atualiza o Server Component do cabeçalho.
 *
 * O botão fica desabilitado durante a requisição para evitar duplo clique.
 */
export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    if (isPending) return;

    setIsPending(true);

    try {
      const response = await fetch("/api/v1/sign-out", { method: "POST" });

      if (!response.ok) throw new Error("Falha ao sair.");

      router.refresh();
    } catch {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      aria-busy={isPending}
      className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-[0.8125rem] font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
      ) : (
        <LogOut aria-hidden className="size-4" strokeWidth={1.8} />
      )}
      <span className="hidden sm:inline">Sair</span>
      <span className="sr-only sm:hidden">Sair</span>
    </button>
  );
}
