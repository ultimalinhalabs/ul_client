"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { getErrorReference, toHumanMessage } from "@/lib/api/errors";
import { useEffect } from "react";

/** Never a raw stack trace to the user. */
export default function OrganizationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <Alert tone="error" title="Something went wrong" reference={getErrorReference(error)}>
        {toHumanMessage(error)}
      </Alert>
      <Button variant="secondary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
