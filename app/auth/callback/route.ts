import { safeNextPath, withNext } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Landing point of every emailed Supabase Auth link (sign-up confirmation,
 * password recovery) and of OAuth: exchanges the PKCE `code` for a session
 * and continues to `next` — sanitized to a same-origin path, so `next` can
 * never become an open redirect.
 *
 * PKCE ties the code to the browser that STARTED the flow. Opened on another
 * device the exchange fails even though Supabase has already confirmed the
 * email — so a failure is never shown as "your email is not confirmed": the
 * person is asked to sign in (sign-up) or to request a new link (recovery).
 * Supabase's own `error_description` is never echoed.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  if (next === "/reset-password") return NextResponse.redirect(`${origin}/forgot-password?notice=link`);
  const login = withNext("/login", next);
  return NextResponse.redirect(`${origin}${login}${login.includes("?") ? "&" : "?"}notice=link`);
}
