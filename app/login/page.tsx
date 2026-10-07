import { AuthLink, AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { safeNextPath, withNext } from "@/lib/auth/redirect";
import { getServerSession } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Iniciar sessão" };

/** Notices a redirect can bring back here (auth/callback, reset-password). Fixed keys → fixed copy: nothing from the URL is ever rendered. */
const NOTICES: Record<string, { tone: "info" | "success" | "warning"; title: string; body: string }> = {
  link: {
    tone: "info",
    title: "Link já utilizado ou expirado",
    body: "Se acabou de confirmar o seu email noutro dispositivo, a confirmação ficou registada — basta iniciar sessão.",
  },
  password_updated: { tone: "success", title: "Palavra-passe alterada", body: "Inicie sessão com a nova palavra-passe." },
  oauth_failed: { tone: "warning", title: "Não foi possível concluir o início de sessão", body: "Tente novamente." },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const session = await getServerSession();
  if (session) redirect(next);

  const noticeKey = typeof params.notice === "string" ? params.notice : typeof params.error === "string" ? params.error : null;
  const notice = noticeKey ? NOTICES[noticeKey] : undefined;

  return (
    <AuthShell
      title="Iniciar sessão"
      description="Aceda às suas propostas, contratos e organizações na Última Linha."
      footer={
        <p>
          Ainda não tem conta? <AuthLink href={withNext("/signup", next)}>Criar conta</AuthLink>
        </p>
      }
    >
      {notice && (
        <Alert tone={notice.tone} title={notice.title} className="mb-6">
          {notice.body}
        </Alert>
      )}
      <LoginForm next={next} googleEnabled={process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true"} />
    </AuthShell>
  );
}
