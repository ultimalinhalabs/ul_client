"use client";

import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Supabase Auth's messages are English. Map the ones a user can actually
 * act on; everything else gets a generic sentence rather than a raw
 * provider string.
 */
export function toSignInMessage(error: { message?: string; code?: string }): string {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "Email ou palavra-passe incorretos.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "O email ainda não foi confirmado. Verifique a sua caixa de correio.";
  }
  if (code.includes("rate_limit") || message.includes("rate limit")) {
    return "Demasiadas tentativas. Aguarde um momento e tente novamente.";
  }
  return "Não foi possível iniciar sessão. Tente novamente.";
}

/**
 * A successful sign-in only proves identity — it says nothing about which
 * organization(s) the user belongs to. That resolution happens at /app
 * (server-side, against GET /v1/me), never here: this form's only job is
 * authentication.
 */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"password" | "google" | null>(null);

  async function handlePasswordSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading("password");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(toSignInMessage(signInError));
      setLoading(null);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading("google");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(toSignInMessage(oauthError));
      setLoading(null);
    }
  }

  return (
    <form onSubmit={handlePasswordSignIn} className="flex w-full flex-col gap-4">
      {error && (
        <Alert tone="error" title="Não foi possível iniciar sessão">
          {error}
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

      <Button type="submit" loading={loading === "password"} disabled={loading !== null} className="mt-1 w-full">
        Iniciar sessão
      </Button>

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
        className="w-full"
      >
        Continuar com Google
      </Button>
    </form>
  );
}
