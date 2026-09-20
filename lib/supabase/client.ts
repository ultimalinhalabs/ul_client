"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Browser-only Supabase client — the one human identity source, shared with
 * ul-platform and ul-console (same Supabase project). The Client Console
 * never implements its own session/JWT mechanism. Session is persisted via
 * cookies (not localStorage) so the same session is readable server-side by
 * lib/supabase/server.ts.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Resolves the current access token for a browser-side API call — see
 * lib/api/client.ts. Returns null when there is no session (never throws):
 * an unauthenticated caller should get a 401 from the API, not a client
 * crash. `getSession()` returns the cached session and transparently
 * refreshes it in the background when near expiry.
 */
export async function getBrowserAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
