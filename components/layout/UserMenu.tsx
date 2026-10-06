"use client";

import { organizationHref } from "@/components/layout/navigation";
import { roleLabel } from "@/lib/labels";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const itemClasses =
  "flex h-8 w-full items-center gap-2 rounded-md px-3 text-left text-body text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg focus-visible:bg-surface-hover focus-visible:text-fg";

/**
 * Menu-button pattern: Escape closes and returns focus to the trigger,
 * the first item is focused on open, arrow keys move, Tab or a click
 * outside closes.
 */
export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const router = useRouter();
  const { organizationId, organizationName, membership } = useActiveOrganization();

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus();

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function onMenuKeyDown(event: React.KeyboardEvent) {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
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

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
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
        aria-label={`Conta: ${email}`}
        className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 text-body text-fg transition-colors hover:bg-surface"
      >
        <span
          className="flex size-7 items-center justify-center rounded-full border border-border bg-surface text-meta font-semibold text-fg"
          aria-hidden
        >
          {email.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-48 truncate text-label text-fg-muted xl:inline">{email}</span>
        <ChevronDown className="size-3.5 text-fg-subtle" aria-hidden />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Conta"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-40 mt-2 w-64 animate-dialog-in rounded-lg border border-border bg-surface p-1 shadow-xl shadow-black/40"
        >
          <div className="border-b border-border-subtle px-3 pb-2.5 pt-2">
            <p className="truncate text-body font-medium text-fg">{email}</p>
            <p className="mt-0.5 truncate text-meta text-fg-subtle">
              {roleLabel(membership.roleKey)} · {organizationName}
            </p>
          </div>
          <div className="mt-1 flex flex-col">
            <Link
              href={organizationHref(organizationId, "settings")}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClasses}
            >
              <Settings className="size-4" aria-hidden />
              Definições
            </Link>
            <button type="button" role="menuitem" onClick={handleLogout} className={itemClasses}>
              <LogOut className="size-4" aria-hidden />
              Terminar sessão
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
