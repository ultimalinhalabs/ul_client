import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { safeNextPath, withNext } from "@/lib/auth/redirect";
import type { Metadata } from "next";
import { VerifyEmailPanel } from "./VerifyEmailPanel";

export const metadata: Metadata = { title: "Confirme o seu email" };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);

  return (
    <AuthShell
      title="Confirme o seu email"
      description="Enviámos um link de confirmação. Abra-o neste dispositivo para continuar exatamente onde estava."
      footer={
        <p>
          Já confirmou? <AuthLink href={withNext("/login", next)}>Iniciar sessão</AuthLink>
        </p>
      }
    >
      <VerifyEmailPanel next={next} />
    </AuthShell>
  );
}
