import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { safeNextPath, withNext } from "@/lib/auth/redirect";
import { getServerSession } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  if (await getServerSession()) redirect(next);

  return (
    <AuthShell
      title="Criar conta"
      description="Use o email para onde a Última Linha enviou a sua proposta. Vamos pedir-lhe que o confirme."
      footer={
        <p>
          Já tem conta? <AuthLink href={withNext("/login", next)}>Iniciar sessão</AuthLink>
        </p>
      }
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
