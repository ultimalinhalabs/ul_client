"use client";

import { useMyMemberships, useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { Check, ChevronDown, Building2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * F17 brief, Fase 2/18: switching organization must re-resolve everything
 * (membership, role, permissions, every org-scoped query) — this never
 * mutates state in place, it navigates via switchOrganization(), which
 * changes the URL's organizationId segment. That's what makes every
 * downstream TanStack Query key different automatically (see
 * lib/organization/query-keys.ts) rather than relying on a manual
 * invalidate-everything call that's easy to forget in one hook.
 */
export function OrganizationSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { organizationId, organizationName, switchOrganization } = useActiveOrganization();
  const { data: me } = useMyMemberships();

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const memberships = me?.memberships ?? [];
  if (memberships.length <= 1) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-primary">
        <Building2 className="size-4 text-text-secondary" aria-hidden />
        {organizationName}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-charcoal-overlay focus-visible:outline-2 focus-visible:outline-champagne"
      >
        <Building2 className="size-4 text-text-secondary" aria-hidden />
        <span className="max-w-[14rem] truncate font-medium">{organizationName}</span>
        <ChevronDown className="size-3.5 text-text-secondary" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 w-64 rounded-md border border-border bg-charcoal-raised py-1 shadow-lg"
        >
          {memberships.map((m) => (
            <button
              key={m.organizationId}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                switchOrganization(m.organizationId);
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-charcoal-overlay"
            >
              <span className="flex flex-col">
                <span className="truncate">{m.organizationName}</span>
                <span className="text-xs text-text-secondary">{m.roleKey}</span>
              </span>
              {m.organizationId === organizationId && <Check className="size-4 shrink-0 text-champagne" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
