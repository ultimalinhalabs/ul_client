"use client";

import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      setError(signInError.message);
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
      setError(oauthError.message);
      setLoading(null);
    }
  }

  return (
    <form onSubmit={handlePasswordSignIn} className="flex w-full max-w-sm flex-col gap-4">
      {error && <Alert tone="error" title="Sign-in failed">{error}</Alert>}

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
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit" loading={loading === "password"} disabled={loading !== null} className="w-full">
        Sign in
      </Button>

      <div className="flex items-center gap-3 text-xs text-text-tertiary">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="secondary"
        loading={loading === "google"}
        disabled={loading !== null}
        onClick={handleGoogleSignIn}
        className="w-full"
      >
        Continue with Google
      </Button>
    </form>
  );
}
