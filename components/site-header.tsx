import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { getSession, type SessionAccount } from "@/server/auth/session";

function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="prova, ir para o início"
      className="inline-flex items-baseline rounded-sm font-display text-[1.45rem] leading-none font-semibold tracking-[-0.045em] text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
    >
      prova
      <span aria-hidden className="ml-0.5 text-signal">
        *
      </span>
    </Link>
  );
}

function Avatar({ email }: { email: string }) {
  const seed = encodeURIComponent(email);

  return (
    // biome-ignore lint/performance/noImgElement: avatar remoto do DiceBear, sem otimização do Next.
    <img
      src={`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`}
      alt=""
      width={36}
      height={36}
      decoding="async"
      className="size-9 shrink-0 rounded-full border border-line bg-paper-raised"
    />
  );
}

function VisitorActions() {
  return (
    <nav aria-label="Acesso à conta" className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/auth/sign-in"
        className="inline-flex h-9 items-center rounded-sm px-3 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        Entrar
      </Link>
      <Link
        href="/auth/sign-up"
        className="inline-flex h-9 items-center rounded-sm bg-signal px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-signal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        Criar conta
      </Link>
    </nav>
  );
}

function AccountActions({ account }: { account: SessionAccount }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar email={account.email} />

        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] leading-tight font-medium text-ink">
            <span className="sm:hidden">{account.firstName}</span>
            <span className="hidden sm:inline">
              {account.firstName} {account.lastName}
            </span>
          </p>
          <p className="hidden truncate text-[0.75rem] leading-tight text-ink-soft sm:block">
            {account.email}
          </p>
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}

/**
 * Cabeçalho da plataforma. Server Component assíncrono: lê a sessão do cookie
 * assinado. O layout o envolve em `<Suspense>` para não bloquear o prerender.
 */
export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Wordmark />

        {session ? <AccountActions account={session} /> : <VisitorActions />}
      </div>
    </header>
  );
}
