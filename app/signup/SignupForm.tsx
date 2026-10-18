"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toAuthMessage } from "@/lib/auth/messages";
import { rememberPendingEmail, withNext } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Supabase Auth sign-up (PKCE, the @supabase/ssr default). UL Auth requires
 * email confirmation, so a successful call returns no session: the person is
 * sent to /verify-email, and the link in the email lands on /auth/callback,
 * which completes the session and continues to `next` (e.g. the proposal).
 *
 * Account enumeration: with confirmation on, Supabase answers an
 * already-registered address exactly like a new one, and this form does the
 * same — the next step is always "check your inbox".
 */
export function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldError(null);
    if (password !== confirmation) {
      setFieldError("As palavras-passe não coincidem.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}${withNext("/auth/callback", next)}` },
    });

    if (signUpError) {
      setError(toAuthMessage(signUpError, "signup"));
      setLoading(false);
      return;
    }

    // Only when a project has confirmation OFF does sign-up return a session — then the person is simply in.
    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }

    rememberPendingEmail(email, true);
    router.push(withNext("/verify-email", next));
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      {error && (
        <Alert tone="error" title="Não foi possível criar a conta">
          {error}
        </Alert>
      )}
      <Input label="Email" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        label="Palavra-passe"
        type="password"
        name="new-password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        hint={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        label="Confirmar palavra-passe"
        type="password"
        name="confirm-password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        error={fieldError ?? undefined}
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
      />
      <Button type="submit" loading={loading} className="mt-1 h-10 w-full">
        Criar conta
      </Button>
    </form>
  );
}
