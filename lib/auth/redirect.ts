/**
 * Block 2B — where to go after an auth step (sign-in, email confirmation,
 * password reset). Only a same-origin, absolute PATH is ever honoured:
 * anything else — a full URL, a protocol-relative `//host`, a backslash
 * trick (`/\host`), control characters — falls back to `/app`. This is what
 * keeps `?next=` from becoming an open redirect.
 */
export const DEFAULT_AFTER_AUTH = "/app";

export function safeNextPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_AFTER_AUTH;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return DEFAULT_AFTER_AUTH;
  if (/[\u0000-\u001f\\]/.test(value)) return DEFAULT_AFTER_AUTH;
  return value;
}

/** `/login?next=…` (or another auth page) with the destination preserved — only when it is not the default. */
export function withNext(path: string, next: string | null | undefined): string {
  const safe = safeNextPath(next);
  return safe === DEFAULT_AFTER_AUTH ? path : `${path}?next=${encodeURIComponent(safe)}`;
}

/**
 * The email waiting for confirmation, kept for the "check your inbox / resend"
 * step. sessionStorage, never the URL: an address is personal data and must
 * not end up in logs, history or a Referer header. Absent (other tab, private
 * window) → the page simply asks for it again.
 */
const PENDING_EMAIL_KEY = "ul-client:pending-verification-email";

/** `sent`: an email was just sent for it (sign-up, resend) — the verify page derives its resend cooldown from that moment. */
export function rememberPendingEmail(email: string, sent: boolean) {
  try {
    sessionStorage.setItem(PENDING_EMAIL_KEY, JSON.stringify({ email, sentAt: sent ? Date.now() : null }));
  } catch {
    // Storage blocked — the verify page asks for the email instead.
  }
}

export function readPendingEmail(): { email: string; sentAt: number | null } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_EMAIL_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as { email?: unknown; sentAt?: unknown };
    if (typeof value.email !== "string") return null;
    return { email: value.email, sentAt: typeof value.sentAt === "number" ? value.sentAt : null };
  } catch {
    return null;
  }
}

export function forgetPendingEmail() {
  try {
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
  } catch {
    // Nothing to clean.
  }
}
