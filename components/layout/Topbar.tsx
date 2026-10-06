"use client";

import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { Brand } from "./Brand";
import { CommandMenu } from "./CommandMenu";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";

/**
 * Global bar. On desktop the organization context lives in the sidebar, so
 * this stays light (search + account). Below lg — where the sidebar is a
 * drawer — it names the active organization so the user always knows which
 * business they're operating on.
 */
export function Topbar({ email }: { email: string }) {
  const { organizationName } = useActiveOrganization();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-canvas px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <div className="lg:hidden">
          <Brand collapsed />
        </div>
        <span className="truncate text-label font-medium text-fg lg:hidden">{organizationName}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <CommandMenu />
        <UserMenu email={email} />
      </div>
    </header>
  );
}
