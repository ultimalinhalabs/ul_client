"use client";

import { roleLabel } from "@/lib/labels";
import { useActiveOrganization, useMyMemberships } from "@/lib/organization/ActiveOrganizationContext";
import { cn } from "@/lib/utils/cn";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

function OrganizationMark({ name }: { name: string }) {
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-meta font-semibold text-fg"
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/**
 * The tenant's primary context, so it lives at the top of the sidebar.
 *
 * F17 brief, Fase 2/18: switching organization must re-resolve everything
 * (membership, role, permissions, every org-scoped query) — this never
 * mutates state in place, it navigates via switchOrganization(), which
 * changes the URL's organizationId segment. That's what makes every
 * downstream TanStack Query key different automatically (see
 * lib/organization/query-keys.ts) rather than relying on a manual
 * invalidate-everything call that's easy to forget in one hook.
 *
 * Menu-button pattern: arrow keys move between organizations, Escape closes
 * and returns focus to the trigger, Tab or a click outside closes.
 */
export function OrganizationSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const { organizationId, organizationName, membership, switchOrganization } = useActiveOrganization();
  const { data: me } = useMyMemberships();
  const memberships = me?.memberships ?? [];
  const canSwitch = memberships.length > 1;
  const currentIndex = Math.max(
    memberships.findIndex((m) => m.organizationId === organizationId),
    0,
  );

  useEffect(() => {
    if (!open) return;
    // Focus lands on the current organization once, when the menu opens.
    itemRefs.current[currentIndex]?.focus();

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, currentIndex]);

  function onMenuKeyDown(event: React.KeyboardEvent) {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  const identity = (
    <>
      <OrganizationMark name={organizationName} />
      {!collapsed && (
        <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
          <span className="truncate text-body font-medium text-fg">{organizationName}</span>
          <span className="truncate text-meta text-fg-subtle">{roleLabel(membership.roleKey)}</span>
        </span>
      )}
    </>
  );

  if (!canSwitch) {
    return (
      <div className={cn("flex items-center gap-2.5 rounded-md px-2 py-1.5", collapsed && "justify-center px-0")} title={collapsed ? organizationName : undefined}>
        {identity}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Organização atual: ${organizationName}. Mudar de organização`}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-surface",
          collapsed && "justify-center px-0",
        )}
      >
        {identity}
        {!collapsed && <ChevronsUpDown className="size-4 shrink-0 text-fg-subtle" aria-hidden />}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Organizações"
          onKeyDown={onMenuKeyDown}
          className="absolute left-0 top-full z-40 mt-1.5 w-64 animate-dialog-in rounded-lg border border-border bg-surface p-1 shadow-xl shadow-black/40"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-meta font-medium text-fg-subtle">Organizações</p>
          {memberships.map((m, index) => {
            const current = m.organizationId === organizationId;
            return (
              <button
                key={m.organizationId}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                onClick={() => {
                  setOpen(false);
                  switchOrganization(m.organizationId);
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover"
              >
                <OrganizationMark name={m.organizationName} />
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-body text-fg">{m.organizationName}</span>
                  <span className="truncate text-meta text-fg-subtle">{roleLabel(m.roleKey)}</span>
                </span>
                {current && <Check className="size-4 shrink-0 text-fg" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
