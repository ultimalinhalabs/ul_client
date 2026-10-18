import logoHorizontal from "@/assets_v0/logo/ul-logo-horizontal-dark.svg";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Block 2B — the one frame for every identity step (sign-in, sign-up, email
 * confirmation, password recovery/reset). A single quiet column: the logo,
 * a heading, one task. No side panel, no illustration — the commercial
 * journey arrives here from a proposal and should feel like the same calm
 * document, not a different product. Logo: assets_v0 (the dark-background
 * horizontal lockup, ASSET_GUIDE.md), imported statically so it ships with
 * the bundle.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Secondary navigation under the card (e.g. "Já tem conta? Iniciar sessão"). */
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-6 pt-8 sm:px-10">
        <Link href="/" aria-label="Última Linha — início" className="inline-flex rounded-md">
          <Image src={logoHorizontal} alt="Última Linha" width={156} height={27} className="h-6 w-auto" priority />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-12 sm:items-center sm:pt-0">
        <div className="w-full max-w-[400px] animate-fade-in">
          <h1 className="text-display font-semibold text-fg-strong">{title}</h1>
          {description && <div className="mt-2 text-body text-fg-muted">{description}</div>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-border-subtle pt-6 text-label text-fg-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

/** A quiet text link inside auth copy — underlined on hover, gold focus ring from the base layer. */
export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-sm font-medium text-fg underline-offset-4 transition-colors hover:text-fg-strong hover:underline">
      {children}
    </Link>
  );
}
