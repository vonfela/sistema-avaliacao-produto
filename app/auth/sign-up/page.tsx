import type { Metadata } from "next";
import { AuthShell } from "../_components/auth-shell";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie a sua conta para avaliar, comparar e descobrir produtos.",
};

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUpForm />
    </AuthShell>
  );
}
