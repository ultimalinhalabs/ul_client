"use client";

import { cn } from "@/lib/utils/cn";
import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { NAV_ITEMS, type NavItem, organizationHref } from "./navigation";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matches(item: NavItem, query: string) {
  const q = normalize(query.trim());
  return !q || normalize(`${item.label} ${item.keywords ?? ""}`).includes(q);
}

/**
 * Ctrl/⌘+K navigation within the active organization. Deliberately navigation-only — it never runs an
 * action, so it can't become a shortcut around a ConfirmDialog. Combobox +
 * listbox with aria-activedescendant: focus stays in the input while the
 * arrow keys move the highlighted option.
 */
export function CommandMenu() {
  const router = useRouter();
  const { organizationId } = useActiveOrganization();
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const results = useMemo(() => NAV_ITEMS.filter((item) => matches(item, query)), [query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function go(item: NavItem | undefined) {
    if (!item) return;
    close();
    router.push(organizationHref(organizationId, item.segment));
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[activeIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-8 items-center gap-2 rounded-md border border-border bg-inset pl-2.5 pr-1.5 text-label text-fg-subtle transition-colors hover:border-fg-subtle/50 hover:text-fg-muted md:flex"
      >
        <Search className="size-3.5" aria-hidden />
        <span className="w-28 text-left">Ir para…</span>
        <kbd className="rounded border border-border px-1.5 font-sans text-meta text-fg-subtle">Ctrl K</kbd>
      </button>

      <dialog
        ref={ref}
        aria-label="Navegação rápida"
        onClose={close}
        onCancel={close}
        onClick={(event) => {
          if (event.target === ref.current) close();
        }}
        className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-lg rounded-lg border border-border bg-surface p-0 text-fg shadow-2xl shadow-black/50 open:animate-dialog-in backdrop:animate-fade-in"
      >
        <div className="flex items-center gap-2.5 border-b border-border-subtle px-4">
          <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={results[activeIndex] ? optionId(activeIndex) : undefined}
            aria-autocomplete="list"
            aria-label="Procurar página"
            placeholder="Procurar página…"
            className="h-12 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-subtle"
          />
        </div>
        <ul id={listboxId} role="listbox" aria-label="Páginas" className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 && <li className="px-3 py-6 text-center text-body text-fg-muted">Nenhuma página corresponde.</li>}
          {results.map((item, index) => {
            const Icon = item.icon;
            const active = index === activeIndex;
            return (
              <li
                key={item.segment}
                id={optionId(index)}
                role="option"
                aria-selected={active}
                onMouseMove={() => setActiveIndex(index)}
                onClick={() => go(item)}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-3 text-body",
                  active ? "bg-surface-hover text-fg" : "text-fg-muted",
                )}
              >
                <Icon className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                <span className="flex-1 truncate">{item.label}</span>
                {active && <CornerDownLeft className="size-3.5 text-fg-subtle" aria-hidden />}
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
