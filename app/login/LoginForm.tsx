"use client";

import { AuthLink } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toAuthMessage } from "@/lib/auth/messages";
import { forgetPendingEmail, rememberPendingEmail, withNext } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Kept for its existing callers/tests — the sign-in flavour of lib/auth/messages.ts. */
export function toSignInMessage(error: { message?: string; code?: string }): string {
  return toAuthMessage(error, "signin");
}

/**
 * A successful sign-in only proves identity — it says nothing about which
 * organization(s) the user belongs to. That resolution happens at /app (or
 * the `next` page, e.g. a proposal), server-side against GET /v1/me, never
 * here: this form's only job is authentication.
 *
 * Google is offered only when NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true — UL Auth
 * has the provider disabled today, and a button that can only fail is not
 * an option.
 */
export function LoginForm({ next, googleEnabled = false }: { next: string; googleEnabled?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; unconfirmed: boolean } | null>(null);
  const [loading, setLoading] = useState<"password" | "google" | null>(null);

  async function handlePasswordSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading("password");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      const unconfirmed = signInError.code === "email_not_confirmed" || /email not confirmed/i.test(signInError.message);
      if (unconfirmed) rememberPendingEmail(email, false);
      setError({ message: toSignInMessage(signInError), unconfirmed });
      setLoading(null);
      return;
    }

    forgetPendingEmail();
    router.push(next);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading("google");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${withNext("/auth/callback", next)}` },
    });
    if (oauthError) {
      setError({ message: toSignInMessage(oauthError), unconfirmed: false });
      setLoading(null);
    }
  }

  return (
    <form onSubmit={handlePasswordSignIn} className="flex w-full flex-col gap-4">
      {error && (
        <Alert tone="error" title="Não foi possível iniciar sessão">
          {error.message}
          {error.unconfirmed && (
            <span className="mt-1 block">
              <AuthLink href={withNext("/verify-email", next)}>Reenviar o email de confirmação</AuthLink>
            </span>
          )}
        </Alert>
      )}

      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Palavra-passe"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="-mt-1 flex justify-end text-label">
        <AuthLink href="/forgot-password">Esqueceu a palavra-passe?</AuthLink>
      </div>

      <Button type="submit" loading={loading === "password"} disabled={loading !== null} className="mt-1 h-10 w-full">
        Iniciar sessão
      </Button>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-meta text-fg-subtle" aria-hidden>
            <div className="h-px flex-1 bg-border-subtle" />
            ou
            <div className="h-px flex-1 bg-border-subtle" />
          </div>
          <Button
            variant="secondary"
            loading={loading === "google"}
            disabled={loading !== null}
            onClick={handleGoogleSignIn}
            className="h-10 w-full"
          >
            Continuar com Google
          </Button>
        </>
      )}
    </form>
  );
}
