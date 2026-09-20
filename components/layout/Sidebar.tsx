"use client";

import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useUiStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils/cn";
import {
  Blocks,
  Gauge,
  KeyRound,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Users,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { segment: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { segment: "members", label: "Members", icon: Users },
  { segment: "applications", label: "Applications", icon: Blocks },
  { segment: "subscriptions", label: "Subscriptions", icon: ShieldCheck },
  { segment: "entitlements", label: "Entitlements", icon: Gauge },
  { segment: "api-keys", label: "API Keys", icon: KeyRound },
  { segment: "webhooks", label: "Webhooks", icon: Webhook },
  { segment: "usage", label: "Usage", icon: Gauge },
  { segment: "settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const pathname = usePathname();
  const { organizationId } = useActiveOrganization();
  const base = `/app/o/${organizationId}`;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex h-full flex-col border-r border-border-subtle bg-charcoal-raised transition-[width]",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4">
        {!collapsed && <span className="text-sm font-semibold tracking-wide text-champagne">ÚLTIMA LINHA</span>}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1.5 text-text-secondary hover:bg-charcoal-overlay hover:text-text-primary focus-visible:outline-2 focus-visible:outline-champagne"
        >
          {collapsed ? <PanelLeftOpen className="size-4" aria-hidden /> : <PanelLeftClose className="size-4" aria-hidden />}
        </button>
      </div>

      <ul className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const href = `${base}/${item.segment}`;
          const active = pathname.startsWith(href);
          const Icon = item.icon;
          return (
            <li key={item.segment}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-champagne focus-visible:outline-offset-1",
                  active
                    ? "bg-champagne/10 text-champagne"
                    : "text-text-secondary hover:bg-charcoal-overlay hover:text-text-primary",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
