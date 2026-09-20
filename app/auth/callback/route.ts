import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** PKCE callback for OAuth (Google) sign-in — exchanges the auth code for a session cookie, then hands off to /app's own organization-resolution redirect. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/app`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
