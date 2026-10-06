"use client";

import { Button } from "@/components/ui/Button";
import { PageState } from "@/components/ui/PageState";
import { getErrorReference, isForbidden, toHumanMessage } from "@/lib/api/errors";
import { useEffect } from "react";

/** Never a raw stack trace to the user. Rendered inside the shell, so navigation stays available. */
export default function OrganizationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const reference = getErrorReference(error) ?? (error.digest ? `Referência: ${error.digest}` : null);

  return (
    <PageState
      variant="error"
      title={isForbidden(error) ? "Sem permissão" : "Não foi possível carregar esta página"}
      actions={
        <Button variant="secondary" onClick={reset}>
          Tentar novamente
        </Button>
      }
    >
      <p>{toHumanMessage(error)}</p>
      {reference && <p className="mt-2 font-mono text-meta text-fg-subtle">{reference}</p>}
    </PageState>
  );
}
