"use client";

import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS, isActivePath, organizationHref } from "./navigation";

/**
 * Grouped navigation, shared by the desktop Sidebar and the MobileNav drawer.
 * Active item: raised surface + a 2px gold indicator — the one persistent use
 * of gold in the shell, which is what makes it read as "you are here".
 */
export function NavLinks({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { organizationId } = useActiveOrganization();

  return (
    <div className="flex flex-col gap-5">
      {NAV_GROUPS.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`} role="group" aria-label={group.label ?? undefined}>
          {group.label &&
            (collapsed ? (
              <div className="mx-3 mb-2 border-t border-border-subtle" aria-hidden />
            ) : (
              <p className="mb-1.5 px-3 text-meta font-medium text-fg-subtle">{group.label}</p>
            ))}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const href = organizationHref(organizationId, item.segment);
              const active = isActivePath(pathname, href);
              const Icon = item.icon;
              return (
                <li key={item.segment}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "relative flex h-8 items-center gap-2.5 rounded-md px-3 text-body transition-colors duration-150",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-surface text-fg before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent"
                        : "text-fg-muted hover:bg-surface/70 hover:text-fg",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active ? "text-fg" : "text-fg-subtle")} aria-hidden />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
