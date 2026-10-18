import logoHorizontal from "@/assets_v0/logo/ul-logo-horizontal-dark.svg";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "./SignOutButton";

/**
 * Block 2B — the signed-in frame for what belongs to the PERSON rather than
 * to one organization: their proposals and the acceptance step, which come
 * before any organization exists. Same calm column as the public proposal,
 * plus who is signed in and a way out.
 */
export function AccountShell({ email, children, width = "document" }: { email: string; children: ReactNode; width?: "document" | "wide" }) {
  const max = width === "document" ? "max-w-3xl" : "max-w-5xl";
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-fg px-3 py-2 text-body font-medium text-fg-inverse focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Saltar para o conteúdo
      </a>
      <header className="border-b border-border-subtle">
        <div className={`mx-auto flex h-16 w-full ${max} items-center justify-between gap-4 px-4 sm:px-6`}>
          <Link href="/app" aria-label="Última Linha — as suas organizações" className="inline-flex shrink-0 rounded-md">
            <Image src={logoHorizontal} alt="Última Linha" width={156} height={27} className="h-6 w-auto" priority />
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden min-w-0 truncate text-label text-fg-subtle sm:block">{email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className={`mx-auto w-full ${max} flex-1 px-4 py-10 outline-none sm:px-6 sm:py-14`}>
        {children}
      </main>
    </div>
  );
}
