"use client";

import { createClient } from "@/lib/supabase/client";
import { isUnauthorized } from "@/lib/api/errors";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * A 401 from any query or mutation means the session is gone (expired,
 * revoked, or the API rejected it) — there is no partial-auth state to
 * preserve, so every 401 signs out and returns to /login. A 403 never does
 * this: authenticated-but-not-authorized-for-this-org-or-action is not a
 * session problem (F17 brief, Fase 2/17) — see tests/providers-session.test.tsx.
 */
function useSessionExpiryHandler() {
  const router = useRouter();

  return (error: unknown) => {
    if (isUnauthorized(error)) {
      const supabase = createClient();
      void supabase.auth.signOut().then(() => {
        router.push("/login");
      });
    }
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const handleExpiry = useSessionExpiryHandler();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => !isUnauthorized(error) && failureCount < 2,
          },
        },
        queryCache: new QueryCache({ onError: handleExpiry }),
        mutationCache: new MutationCache({ onError: handleExpiry }),
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
