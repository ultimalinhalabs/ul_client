"use client";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Ends the Supabase session and drops every cached query, so nothing of this person's data outlives the session in memory. */
export function SignOutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await createClient().auth.signOut();
    queryClient.clear();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} loading={loading}>
      Terminar sessão
    </Button>
  );
}
