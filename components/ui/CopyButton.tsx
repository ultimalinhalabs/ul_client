"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, type ButtonProps } from "./Button";

/** Copies `value` and confirms in place (icon + text), then resets. */
export function CopyButton({
  value,
  label = "Copiar",
  copiedLabel = "Copiado",
  size = "sm",
  variant = "secondary",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={handleCopy}>
        {copied ? <Check className="text-success" aria-hidden /> : <Copy aria-hidden />}
        {copied ? copiedLabel : label}
      </Button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copiado para a área de transferência" : ""}
      </span>
    </>
  );
}
