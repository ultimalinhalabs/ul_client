import { NoOrganizationState } from "@/components/organization/NoOrganizationState";
import { OrganizationPicker } from "@/components/organization/OrganizationPicker";
import { getMe } from "@/lib/api/me";
import { getServerSession } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Your organizations" };

/**
 * F17 brief, Fase 1 routing decision: organizationId lives in the URL
 * (/app/o/[organizationId]/...), never only in memory/store — this page is
 * the entry point that resolves *which* organization that should be. Exactly
 * one membership skips straight to its dashboard; zero or several render a
 * real page here rather than guessing.
 */
export default async function AppEntryPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const me = await getMe(session.accessToken);

  if (me.memberships.length === 0) {
    return <NoOrganizationState email={session.user.email ?? session.user.id} />;
  }

  if (me.memberships.length === 1) {
    redirect(`/app/o/${me.memberships[0].organizationId}/dashboard`);
  }

  return <OrganizationPicker memberships={me.memberships} />;
}
