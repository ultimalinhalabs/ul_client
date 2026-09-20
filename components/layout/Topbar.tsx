"use client";

import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { UserMenu } from "./UserMenu";

export function Topbar({ email }: { email: string }) {
  const { membership } = useActiveOrganization();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-charcoal px-6">
      <OrganizationSwitcher />
      <UserMenu email={email} roleKey={membership.roleKey} />
    </header>
  );
}
