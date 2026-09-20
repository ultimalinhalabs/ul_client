import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Server-side Supabase client for Server Components, Server Actions and
 * Route Handlers — reads the session `proxy.ts` already refreshed. Must be
 * created fresh per request (never a module-level singleton — see
 * @supabase/ssr's createServerClient docs): cookies are request-scoped.
 *
 * `setAll` can fail here (Server Components can't write cookies) — that's
 * expected and safe to ignore, because `proxy.ts` is the one place that
 * actually persists a refreshed session back to the browser.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — no-op, see proxy.ts.
        }
      },
    },
  });
}

/** The authenticated user and their access token, or null when unauthenticated. */
export async function getServerSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  return { user, accessToken: session.access_token };
}
