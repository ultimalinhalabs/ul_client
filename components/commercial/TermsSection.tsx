import { ChevronDown } from "lucide-react";

/**
 * Block 2B — the terms frozen with the proposal/contract, shown verbatim
 * (whitespace preserved) and never edited or summarised here: the text the
 * person reads is exactly the text the snapshot hash covers. Collapsed by
 * default with a native <details>, so it stays keyboard- and
 * screen-reader-friendly without any script.
 */
export function TermsSection({
  title,
  version,
  body,
  defaultOpen = false,
}: {
  title: string;
  version: number;
  body: string;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-border-subtle bg-surface/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-body font-medium text-fg">{title}</span>
          <span className="mt-0.5 block text-meta text-fg-subtle">Versão {version}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="max-h-[28rem] overflow-y-auto border-t border-border-subtle px-5 py-4">
        <div className="whitespace-pre-wrap break-words text-body leading-relaxed text-fg-muted">{body}</div>
      </div>
    </details>
  );
}
