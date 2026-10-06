import stateError from "@/assets/client/ul-state-error.svg";
import emptySearch from "@/assets/client/ul-empty-search.svg";
import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Full-page system states (access denied, not found, route error) — one
 * layout so they read as the same product. Uses ASSET_GUIDE.md §10's
 * official state icons; no illustration beyond that.
 */
export function PageState({
  variant,
  eyebrow,
  title,
  children,
  actions,
}: {
  variant: "error" | "missing";
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-16 text-center sm:py-24">
      <Image src={variant === "error" ? stateError : emptySearch} alt="" width={48} height={48} />
      {eyebrow && <p className="mt-6 font-mono text-meta uppercase tracking-wider text-fg-subtle">{eyebrow}</p>}
      <h1 className="mt-2 text-title font-semibold text-fg">{title}</h1>
      {children && <div className="mt-2 text-body text-fg-muted">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}
