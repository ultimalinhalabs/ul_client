import logoHorizontal from "@/assets_v0/logo/ul-logo-horizontal-dark.svg";
import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Block 2B — the frame of a commercial document read outside the tenant
 * console (the public proposal). A single reading column with generous
 * margins; the logo (assets_v0) is the only brand element. Deliberately not
 * the app shell: a prospect has no organization yet, and a proposal should
 * read like a document, not a dashboard.
 */
export function DocumentShell({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Image src={logoHorizontal} alt="Última Linha" width={156} height={27} className="h-6 w-auto" priority />
          {aside && <div className="min-w-0 truncate text-label text-fg-subtle">{aside}</div>}
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>
      <footer className="border-t border-border-subtle">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 text-meta text-fg-subtle sm:px-6">Última Linha</div>
      </footer>
    </div>
  );
}

/** The heading block of a proposal/contract: eyebrow, identifier, and the parties/validity facts as a quiet grid. */
export function DocumentHeader({
  eyebrow,
  title,
  facts,
  children,
}: {
  eyebrow: string;
  title: string;
  facts: { label: string; value: ReactNode }[];
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6">
      <div>
        <p className="text-label font-medium text-accent">{eyebrow}</p>
        <h1 className="mt-2 break-words text-display font-semibold text-fg-strong">{title}</h1>
        {children && <div className="mt-3 max-w-2xl text-body text-fg-muted">{children}</div>}
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border-y border-border-subtle py-5 sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-meta font-medium text-fg-subtle">{fact.label}</dt>
            <dd className="mt-1 break-words text-body text-fg">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
