"use client";

import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** The Supabase Auth identity itself (email, id) — distinct from useMe(), which is ul-platform's own view (memberships). Used for display only (e.g. Settings > Account), never for authorization. */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      return user;
    },
  });
}
