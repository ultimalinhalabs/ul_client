import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "./lib/supabase/env";

/**
 * Refreshes the Supabase session cookie on every navigation (Next.js 16
 * renamed `middleware.ts` to `proxy.ts`). This is session refresh only, not
 * authorization: it never decides who may see a page or which organization
 * they may act in. That decision is made server-side, per request, against
 * GET /v1/me and the organization's own membership in
 * app/(app)/o/[organizationId]/layout.tsx, and every mutation the API
 * itself gates behind its real permission checks — a client-side check is
 * never the security boundary.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Triggers a token refresh (and the setAll write-back above) when needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
