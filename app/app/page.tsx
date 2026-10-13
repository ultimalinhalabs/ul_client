import { SignOutButton } from "@/components/layout/SignOutButton";
import { NoOrganizationState } from "@/components/organization/NoOrganizationState";
import { OrganizationPicker } from "@/components/organization/OrganizationPicker";
import { PageState } from "@/components/ui/PageState";
import { ApiError, toHumanMessage } from "@/lib/api/errors";
import { getMe } from "@/lib/api/me";
import type { Me } from "@/lib/api/types";
import { resolveAppEntry } from "@/lib/organization/onboarding";
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

  const entry = resolveAppEntry(me);
  if (entry.kind === "onboarding") {
    return <NoOrganizationState email={session.user.email ?? me.email ?? me.userId} userId={me.userId} emailVerified={me.emailVerified} />;
  }
  if (entry.kind === "redirect") redirect(entry.to);

  return <OrganizationPicker memberships={me.memberships} />;
}
