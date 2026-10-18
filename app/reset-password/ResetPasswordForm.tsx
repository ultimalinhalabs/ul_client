"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toAuthMessage } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Sets the new password on the recovery session, then ends that session: the
 * person signs in again with the new password, which proves it works and
 * leaves no long-lived session behind from an emailed link.
 */
export function ResetPasswordForm() {
  const router = useRouter();
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
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(toAuthMessage(updateError, "reset"));
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/login?notice=password_updated");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <Alert tone="error" title="Não foi possível alterar a palavra-passe">
          {error}
        </Alert>
      )}
      <Input
        label="Nova palavra-passe"
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
        label="Confirmar nova palavra-passe"
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
        Guardar nova palavra-passe
      </Button>
    </form>
  );
}
