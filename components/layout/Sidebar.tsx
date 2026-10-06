"use client";

import { useUiStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils/cn";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Brand } from "./Brand";
import { NavLinks } from "./NavLinks";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

/** Desktop navigation (lg+). Below lg, the Topbar's MobileNav drawer renders the same pieces. */
export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-border-subtle bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex h-14 shrink-0 items-center px-4", collapsed && "justify-center px-0")}>
        <Brand collapsed={collapsed} />
      </div>

      <div className={cn("shrink-0 border-b border-border-subtle px-2 pb-3", collapsed && "px-3")}>
        <OrganizationSwitcher collapsed={collapsed} />
      </div>

      <nav aria-label="Principal" className="flex-1 overflow-y-auto px-2 py-3">
        <NavLinks collapsed={collapsed} />
      </nav>

      <div className={cn("flex shrink-0 border-t border-border-subtle p-2", collapsed ? "justify-center" : "justify-end")}>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          aria-expanded={!collapsed}
          className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface hover:text-fg"
        >
          {collapsed ? <PanelLeftOpen className="size-4" aria-hidden /> : <PanelLeftClose className="size-4" aria-hidden />}
        </button>
      </div>
    </aside>
  );
}
