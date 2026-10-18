import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { getServerSession } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Nova palavra-passe" };

/**
 * Reached from the recovery email through /auth/callback, which has already
 * exchanged the link's code for a (recovery) session. Without that session
 * there is nothing to reset — the link expired, was used, or was opened in
 * another browser — so the person is sent back to request a new one.
 */
export default async function ResetPasswordPage() {
  const session = await getServerSession();
  if (!session) redirect("/forgot-password?notice=link");

  return (
    <AuthShell
      title="Definir nova palavra-passe"
      description={
        <>
          Para a conta <span className="break-all font-medium text-fg">{session.user.email}</span>.
        </>
      }
      footer={
        <p>
          Não pediu esta alteração? <AuthLink href="/login">Voltar ao início de sessão</AuthLink>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
