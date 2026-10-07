"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toAuthMessage } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

/**
 * Supabase Auth recovery (PKCE): the email link returns to /auth/callback,
 * which opens a short recovery session and continues to /reset-password.
 * The answer is the same whether or not an account exists for the address —
 * this page never confirms who has an account.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: recoveryError } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });
    setLoading(false);
    if (recoveryError) {
      setError(toAuthMessage(recoveryError, "recovery"));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Alert tone="success" title="Verifique o seu email">
        Se existir uma conta com <span className="break-all font-medium text-fg">{email}</span>, enviámos um link para
        definir uma nova palavra-passe. Abra-o neste dispositivo e navegador.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <Alert tone="error" title="Não foi possível enviar o email">
          {error}
        </Alert>
      )}
      <Input label="Email" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" loading={loading} className="mt-1 h-10 w-full">
        Enviar link de recuperação
      </Button>
    </form>
  );
}
