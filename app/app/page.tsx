import { SignOutButton } from "@/components/layout/SignOutButton";
import { NoOrganizationState } from "@/components/organization/NoOrganizationState";
import { OrganizationPicker } from "@/components/organization/OrganizationPicker";
import { PageState } from "@/components/ui/PageState";
import { ApiError, toHumanMessage } from "@/lib/api/errors";
import { getMe } from "@/lib/api/me";
import type { Me } from "@/lib/api/types";
import { getServerSession } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "As suas organizações" };

export default async function AppEntryPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  let me: Me;
  try {
    me = await getMe(session.accessToken);
  } catch (error) {
    // Block 2B — a disabled account is refused by ul-platform before anything else (403 ACCOUNT_DISABLED): say so, plainly.
    const disabled = error instanceof ApiError && error.code === "ACCOUNT_DISABLED";
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <PageState variant="error" title={disabled ? "Conta desativada" : "Não foi possível carregar a sua conta"} actions={<SignOutButton />}>
          {toHumanMessage(error)}
        </PageState>
      </div>
    );
  }

  if (me.memberships.length === 0) {
    return <NoOrganizationState email={session.user.email ?? session.user.id} />;
  }

  if (me.memberships.length === 1) {
    redirect(`/app/o/${me.memberships[0].organizationId}/dashboard`);
  }

  return <OrganizationPicker memberships={me.memberships} />;
}
