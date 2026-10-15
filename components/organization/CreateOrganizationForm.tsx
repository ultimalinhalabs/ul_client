"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, getErrorReference, toHumanMessage } from "@/lib/api/errors";
import { getMe } from "@/lib/api/me";
import { createOrganization } from "@/lib/api/organizations";
import type { Organization } from "@/lib/api/types";
import { creationKeyFor, isAmbiguousCreateFailure, ORGANIZATION_NAME_MAX, validateOrganizationName } from "@/lib/organization/onboarding";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Outcome =
  | { kind: "created"; organization: Organization }
  /** The request's answer was lost, but /v1/me now shows a membership: it was created — never resend. */
  | { kind: "recovered" };

/**
 * Block 2C — the first organization of a signed-in person with none.
 *
 * ul-platform decides everything that matters: it creates the organization
 * AND the caller's OWNER membership in one transaction; this form sends only
 * a name, with an Idempotency-Key per name attempt (creationKeyFor): a retry
 * of the same name replays the organization already created instead of a
 * second one. On top of that: one request in flight at a time, no form after
 * a success, and — when a failure leaves it unknown whether the server
 * committed (network, 5xx) — a re-read of /v1/me before any retry is offered.
 * The server, not this form, enforces the verified email (403
 * EMAIL_NOT_VERIFIED) and the per-user limits (429).
 */
export function CreateOrganizationForm() {
  const router = useRouter();
  const inFlight = useRef(false);
  const attempt = useRef<{ name: string; key: string } | null>(null);
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const create = useMutation({
    mutationFn: async ({ name: validName, key }: { name: string; key: string }) => {
      const accessToken = await getBrowserAccessToken();
      try {
        return { kind: "created", organization: await createOrganization(accessToken, { name: validName }, key) } as const;
      } catch (error) {
        if (!isAmbiguousCreateFailure(error)) throw error;
        // Did it commit before the answer was lost? The person had no organization, so any membership now is this one.
        const me = await getMe(accessToken).catch(() => null);
        if (me && me.memberships.length > 0) return { kind: "recovered" } as const;
        throw error;
      }
    },
    onSuccess: (result) => {
      setOutcome(result);
      router.push(result.kind === "created" ? `/app/o/${result.organization.id}/dashboard` : "/app");
      router.refresh();
    },
    onSettled: () => {
      inFlight.current = false;
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || outcome) return;
    const validation = validateOrganizationName(name);
    if (!validation.ok) {
      setFieldError(validation.error);
      return;
    }
    setFieldError(null);
    inFlight.current = true;
    attempt.current = creationKeyFor(attempt.current, validation.name);
    create.mutate(attempt.current);
  }

  if (outcome) {
    const href = outcome.kind === "created" ? `/app/o/${outcome.organization.id}/dashboard` : "/app";
    return (
      <Alert
        tone="success"
        title={outcome.kind === "created" ? `Organização “${outcome.organization.name}” criada` : "A organização já foi criada"}
        action={
          <Button variant="secondary" size="sm" onClick={() => router.push(href)}>
            Abrir a organização
          </Button>
        }
      >
        É o proprietário (OWNER). A abrir o espaço da organização…
      </Alert>
    );
  }

  const error = create.error;
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <Alert
          tone="error"
          title="Não foi possível criar a organização"
          reference={getErrorReference(error)}
          action={
            error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED" ? (
              <Link href="/verify-email" className="text-label text-fg underline">
                Reenviar confirmação
              </Link>
            ) : undefined
          }
        >
          {toHumanMessage(error)}
        </Alert>
      )}
      <Input
        label="Nome da organização"
        name="organization-name"
        autoComplete="organization"
        required
        maxLength={ORGANIZATION_NAME_MAX}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldError ?? undefined}
        hint="O nome da empresa ou do projeto. Pode alterá-lo mais tarde nas definições."
      />
      <div>
        <Button type="submit" loading={create.isPending} disabled={create.isPending}>
          Criar organização
        </Button>
      </div>
    </form>
  );
}
