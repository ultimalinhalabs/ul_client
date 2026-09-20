"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { toHumanMessage } from "@/lib/api/errors";
import { useApplications } from "@/hooks/useApplications";
import { useCreateWebhook } from "@/hooks/useWebhooks";
import { X } from "lucide-react";
import { useState } from "react";

/** Mirrors ul-platform's real eventType pattern (createWebhookEndpointSchema) for immediate feedback — the backend re-validates regardless. */
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

export function CreateWebhookDialog({
  open,
  onClose,
  organizationId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  onCreated: (secret: string) => void;
}) {
  const applicationsQuery = useApplications();
  const [applicationKey, setApplicationKey] = useState("");
  const [url, setUrl] = useState("");
  const [eventTypeDraft, setEventTypeDraft] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const createWebhook = useCreateWebhook(organizationId);

  function handleClose() {
    setApplicationKey("");
    setUrl("");
    setEventTypeDraft("");
    setEventTypes([]);
    setError(null);
    onClose();
  }

  function addEventType() {
    const value = eventTypeDraft.trim();
    if (!value || !EVENT_TYPE_PATTERN.test(value) || eventTypes.includes(value)) return;
    setEventTypes((prev) => [...prev, value]);
    setEventTypeDraft("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    createWebhook.mutate(
      { applicationKey, url, eventTypes },
      {
        onError: (err) => setError(toHumanMessage(err)),
        onSuccess: (endpoint) => {
          handleClose();
          onCreated(endpoint.secret);
        },
      },
    );
  }

  const draftInvalid = eventTypeDraft.length > 0 && !EVENT_TYPE_PATTERN.test(eventTypeDraft);

  return (
    <Dialog open={open} onClose={handleClose} title="Add webhook endpoint">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error" title="Could not create webhook endpoint">{error}</Alert>}

        {applicationsQuery.data && (
          <Select
            label="Application"
            required
            options={[{ value: "", label: "Select an application" }, ...applicationsQuery.data.map((a) => ({ value: a.key, label: a.name }))]}
            value={applicationKey}
            onChange={(e) => setApplicationKey(e.target.value)}
          />
        )}

        <Input label="Endpoint URL" type="url" required placeholder="https://example.com/webhooks/ul" value={url} onChange={(e) => setUrl(e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Event types"
            hint='e.g. "payment.completed" — domain.action format'
            error={draftInvalid ? "Must follow the domain.action format" : undefined}
            value={eventTypeDraft}
            onChange={(e) => setEventTypeDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEventType();
              }
            }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={addEventType} disabled={!eventTypeDraft || draftInvalid}>
            Add event type
          </Button>
          {eventTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {eventTypes.map((type) => (
                <span key={type} className="flex items-center gap-1 rounded-full bg-charcoal-overlay px-2.5 py-1 font-mono text-xs text-text-primary">
                  {type}
                  <button type="button" onClick={() => setEventTypes((prev) => prev.filter((t) => t !== type))} aria-label={`Remove ${type}`}>
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={createWebhook.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={createWebhook.isPending} disabled={!applicationKey || !url || eventTypes.length === 0}>
            Create
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
