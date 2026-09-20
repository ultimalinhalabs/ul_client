"use client";

import { createClient } from "@/lib/supabase/client";
import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function UserMenu({ email, roleKey }: { email: string; roleKey: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
        <span className="flex size-7 items-center justify-center rounded-full bg-champagne/15 text-xs font-semibold text-champagne">
          {email.charAt(0).toUpperCase()}
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-xs font-medium">{email}</span>
          <span className="text-[11px] text-text-secondary">{roleKey}</span>
        </span>
        <ChevronDown className="size-3.5 text-text-secondary" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 rounded-md border border-border bg-charcoal-raised py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-charcoal-overlay"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
