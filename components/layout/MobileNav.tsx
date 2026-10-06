"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Brand } from "./Brand";
import { NavLinks } from "./NavLinks";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

/**
 * Below lg the sidebar is gone and this drawer takes its place — including
 * the organization switcher, so the tenant context is one tap away on a phone. A native
 * modal <dialog>, like components/ui/Dialog — focus trap, Escape and inert
 * background come from the browser.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir navegação"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="-ml-1.5 rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface hover:text-fg lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <dialog
        ref={ref}
        aria-label="Navegação"
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
        className="m-0 h-dvh max-h-dvh w-72 max-w-[85vw] border-r border-border-subtle bg-sidebar p-0 text-fg open:animate-drawer-in backdrop:animate-fade-in lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            <Brand />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar navegação"
              className="-mr-1.5 rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface hover:text-fg"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="shrink-0 border-b border-border-subtle px-2 pb-3">
            <OrganizationSwitcher />
          </div>
          <nav aria-label="Principal" className="flex-1 overflow-y-auto px-2 py-3">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      </dialog>
    </>
  );
}
