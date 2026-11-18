"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { type UseFormRegisterReturn, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  SIGN_IN_UNEXPECTED_ERROR_MESSAGE,
  type SignInInput,
  signInSchema,
} from "@/features/sign-in/schema";
import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoCapitalize?: string;
  spellCheck?: boolean;
  registration: UseFormRegisterReturn;
  trailing?: ReactNode;
};

function Field({
  id,
  label,
  error,
  hint,
  type = "text",
  autoComplete,
  inputMode,
  autoCapitalize,
  spellCheck,
  registration,
  trailing,
}: FieldProps) {
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-[0.8125rem] font-medium tracking-[-0.005em] text-ink">
        {label}
      </Label>

      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full border-x-0 border-t-0 border-b border-ink/50 bg-transparent px-0 pt-1 pb-2 text-[0.9375rem] text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-soft/50 hover:border-ink/65 focus-visible:border-signal focus-visible:shadow-[0_1px_0_0_var(--auth-signal)] aria-invalid:border-destructive aria-invalid:focus-visible:shadow-[0_1px_0_0_var(--auth-destructive)]",
            trailing && "pr-11",
          )}
          {...registration}
        />
        {trailing}
      </div>

      {hint && !error ? (
        <p id={hintId} className="text-[0.75rem] leading-5 text-ink-soft">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-[0.75rem] leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
      aria-pressed={visible}
      className="absolute right-0 bottom-1 flex size-9 items-center justify-center rounded-sm text-ink-soft transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-signal focus-visible:outline-none"
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.8} />
    </button>
  );
}

/**
 * Só aceita caminhos internos. Rejeita `//evil.com`, `/\evil.com` e qualquer
 * URL absoluta, evitando open redirect via `?next=`.
 */
function resolveNextPath(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";

  return value;
}

type SignInApiResponse = {
  message?: string;
};

async function requestSignIn(input: SignInInput): Promise<void> {
  let response: Response;

  try {
    response = await fetch("/api/v1/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(SIGN_IN_UNEXPECTED_ERROR_MESSAGE);
  }

  if (response.ok) return;

  let payload: SignInApiResponse | null = null;

  try {
    payload = (await response.json()) as SignInApiResponse;
  } catch {
    payload = null;
  }

  throw new Error(payload?.message ?? SIGN_IN_UNEXPECTED_ERROR_MESSAGE);
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = resolveNextPath(searchParams.get("next"));
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formErrorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (formError) {
      formErrorRef.current?.focus();
    }
  }, [formError]);

  const onSubmit = handleSubmit(async (values) => {
    if (isPending) return;

    setFormError(null);
    setIsPending(true);

    try {
      await requestSignIn(values);
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : SIGN_IN_UNEXPECTED_ERROR_MESSAGE);
    } finally {
      setIsPending(false);
    }
  });

  return (
    <div className="w-full">
      <div className="max-w-[38ch]">
        <h1 className="font-display text-[2.5rem] leading-[1.02] tracking-[-0.045em] text-balance sm:text-[2.75rem]">
          Entre na sua conta
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-7 text-pretty text-ink-soft">
          Volte para avaliar produtos, acompanhar suas resenhas e guardar o que vale a pena.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-9 flex flex-col gap-5">
        {formError ? (
          <div
            ref={formErrorRef}
            role="alert"
            tabIndex={-1}
            className="flex gap-3 border-l-2 border-destructive bg-destructive/5 px-4 py-3 outline-none"
          >
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-[0.8125rem] font-medium text-destructive">
                Não foi possível entrar
              </p>
              <p className="mt-1 text-[0.8125rem] leading-5 text-destructive/90">{formError}</p>
            </div>
          </div>
        ) : null}

        <Field
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          registration={register("email")}
          error={errors.email?.message}
        />

        <Field
          id="password"
          label="Senha"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          registration={register("password")}
          error={errors.password?.message}
          trailing={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />
          }
        />

        <div className="mt-1 flex flex-col gap-4">
          <Button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="h-12 w-full rounded-sm bg-signal px-6 text-[0.9375rem] font-medium text-white hover:bg-signal/90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Entrando…
              </>
            ) : (
              "Entrar"
            )}
          </Button>

          <p className="flex items-center gap-1.5 text-[0.75rem] leading-5 text-ink-soft">
            <LockKeyhole aria-hidden className="size-3.5" strokeWidth={1.8} />
            Conexão segura. Sua sessão dura 7 dias.
          </p>
        </div>
      </form>

      <p className="mt-8 text-[0.8125rem] leading-6 text-ink-soft">
        Ainda não tem conta?{" "}
        <Link
          href="/auth/sign-up"
          className="font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:text-signal focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
