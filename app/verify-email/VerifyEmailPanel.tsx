"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toAuthMessage } from "@/lib/auth/messages";
import { readPendingEmail, rememberPendingEmail, withNext } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import { MailCheck } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

/** UL Auth sends at most one email per address every 60 s (smtp_max_frequency) — the button waits as long. */
export const RESEND_COOLDOWN_SECONDS = 60;

const subscribeNever = () => () => {};
const readPendingSnapshot = () => {
  const pending = readPendingEmail();
  return pending ? JSON.stringify(pending) : null; // a string: stable between renders, as useSyncExternalStore requires
};

/**
 * The pending email lives in sessionStorage (lib/auth/redirect.ts) — a value
 * that only exists in the browser, read with useSyncExternalStore (same
 * reasoning as OrganizationPicker): null during SSR and the first hydration
 * pass, the stored value after.
 */
function usePendingEmail() {
  const raw = useSyncExternalStore(subscribeNever, readPendingSnapshot, () => null);
  return useMemo(() => (raw ? (JSON.parse(raw) as { email: string; sentAt: number | null }) : null), [raw]);
}

export function VerifyEmailPanel({ next }: { next: string }) {
  const pending = usePendingEmail();
  const [typedEmail, setTypedEmail] = useState("");
  const [resentAt, setResentAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const email = pending?.email ?? typedEmail;
  const lastSentAt = resentAt ?? pending?.sentAt ?? null;
  const cooldown = lastSentAt ? Math.max(0, RESEND_COOLDOWN_SECONDS - Math.floor((now - lastSentAt) / 1000)) : 0;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleResend(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);
    const { error } = await createClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}${withNext("/auth/callback", next)}` },
    });
    setLoading(false);
    if (error) {
      setStatus({ tone: "error", message: toAuthMessage(error, "resend") });
      return;
    }
    rememberPendingEmail(email, true);
    setResentAt(Date.now());
    setNow(Date.now());
    // Same answer whether or not the address has a pending account — no enumeration.
    setStatus({ tone: "success", message: "Se existir uma conta por confirmar com este email, enviámos um novo link." });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4 rounded-lg border border-border-subtle bg-surface/50 p-5">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 text-body text-fg-muted">
          {pending ? (
            <p>
              O link foi enviado para <span className="break-all font-medium text-fg">{pending.email}</span>. Pode demorar
              alguns minutos — verifique também a pasta de spam.
            </p>
          ) : (
            <p>Indique o email com que criou a conta para receber um novo link de confirmação.</p>
          )}
        </div>
      </div>

      {status && (
        <Alert tone={status.tone} title={status.tone === "success" ? "Pedido registado" : "Não foi possível reenviar"}>
          {status.message}
        </Alert>
      )}

      <form onSubmit={handleResend} className="flex flex-col gap-4">
        {!pending && (
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
          />
        )}
        <Button type="submit" variant="secondary" loading={loading} disabled={cooldown > 0 || !email} className="h-10 w-full">
          {cooldown > 0 ? `Reenviar email (${cooldown}s)` : "Reenviar email de confirmação"}
        </Button>
      </form>
    </div>
  );
}
