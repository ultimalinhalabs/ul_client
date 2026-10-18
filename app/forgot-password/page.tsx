import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Recuperar palavra-passe" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const params = await searchParams;
  const expired = params.notice === "link";

  return (
    <AuthShell
      title="Recuperar palavra-passe"
      description="Indique o email da sua conta. Enviamos um link para definir uma nova palavra-passe."
      footer={
        <p>
          Lembrou-se? <AuthLink href="/login">Iniciar sessão</AuthLink>
        </p>
      }
    >
      {expired && (
        <Alert tone="warning" title="O link de recuperação expirou ou já foi usado" className="mb-6">
          Peça um novo link abaixo e abra-o neste mesmo dispositivo e navegador.
        </Alert>
      )}
      <ForgotPasswordForm />
    </AuthShell>
  );
}
