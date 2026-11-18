"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { type UseFormRegisterReturn, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type SignUpInput, signUpSchema } from "@/features/sign-up/schema";
import { trpc } from "@/lib/trpc/provider";
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
  minLength?: number;
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
  minLength,
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
          minLength={minLength}
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

function PasswordToggle({
  visible,
  onToggle,
  label,
}: {
  visible: boolean;
  onToggle: () => void;
  label: string;
}) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
      aria-pressed={visible}
      className="absolute right-0 bottom-1 flex size-9 items-center justify-center rounded-sm text-ink-soft transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-signal focus-visible:outline-none"
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.8} />
    </button>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const formErrorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const signUp = trpc.signUp.useMutation({
    onSuccess: () => {
      router.push("/auth/sign-up/success");
      router.refresh();
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  useEffect(() => {
    if (formError) {
      formErrorRef.current?.focus();
    }
  }, [formError]);

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    signUp.mutate(values);
  });

  return (
    <div className="w-full">
      <div className="max-w-[38ch]">
        <h1 className="font-display text-[2.5rem] leading-[1.02] tracking-[-0.045em] text-balance sm:text-[2.75rem]">
          Crie sua conta
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-7 text-pretty text-ink-soft">
          Leva menos de um minuto. Depois você já pode avaliar, comparar e guardar o que vale a
          pena.
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
                Não foi possível criar sua conta
              </p>
              <p className="mt-1 text-[0.8125rem] leading-5 text-destructive/90">{formError}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <Field
            id="firstName"
            label="Primeiro nome"
            autoComplete="given-name"
            registration={register("firstName")}
            error={errors.firstName?.message}
          />
          <Field
            id="lastName"
            label="Sobrenome"
            autoComplete="family-name"
            registration={register("lastName")}
            error={errors.lastName?.message}
          />
        </div>

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
          autoComplete="new-password"
          minLength={8}
          hint="Mínimo de 8 caracteres."
          registration={register("password")}
          error={errors.password?.message}
          trailing={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              label="senha"
            />
          }
        />

        <Field
          id="confirmPassword"
          label="Confirme sua senha"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          registration={register("confirmPassword")}
          error={errors.confirmPassword?.message}
          trailing={
            <PasswordToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((value) => !value)}
              label="confirmação de senha"
            />
          }
        />

        <div className="mt-1 flex flex-col gap-4">
          <Button
            type="submit"
            disabled={signUp.isPending}
            aria-busy={signUp.isPending}
            className="h-12 w-full rounded-sm bg-signal px-6 text-[0.9375rem] font-medium text-white hover:bg-signal/90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-60"
          >
            {signUp.isPending ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Criando sua conta…
              </>
            ) : (
              "Criar minha conta"
            )}
          </Button>

          <p className="flex items-center gap-1.5 text-[0.75rem] leading-5 text-ink-soft">
            <LockKeyhole aria-hidden className="size-3.5" strokeWidth={1.8} />
            Conexão segura. Seus dados ficam protegidos.
          </p>
        </div>
      </form>

      <p className="mt-8 text-[0.8125rem] leading-6 text-ink-soft">
        Já tem uma conta?{" "}
        <Link
          href="/auth/sign-in"
          className="font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:text-signal focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
