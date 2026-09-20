import { OrganizationGate } from "@/components/organization/OrganizationGate";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-side checkpoint #1 of 3 (see proxy.ts and app/providers.tsx for
 * the other two, same three-checkpoint posture ul-console uses): no
 * session -> /login. The organizationId -> membership cross-check itself
 * happens client-side in OrganizationGate (it needs GET /v1/me, fetched
 * through TanStack Query so the rest of the tree can share that cache) —
 * this layout only proves the visitor is authenticated at all.
 */
export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <OrganizationGate organizationId={organizationId} email={session.user.email ?? session.user.id}>
      {children}
    </OrganizationGate>
  );
}
