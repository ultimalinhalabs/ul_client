import type { ContractDetail, ProposalItemView } from "@/lib/api/types";

/**
 * Block 2B — how a contract's lifecycle state reads to the client. The
 * states are ul-platform's (src/db/schema/contracts.ts); the lifecycle is a
 * UL operation, so every sentence says what happens next and who does it —
 * never an action the client could take here.
 */
const STATUS_COPY: Record<string, { title: string; body: string }> = {
  pending_activation: {
    title: "A aguardar ativação",
    body: "O contrato foi criado com a sua aceitação. A Última Linha ativa-o e, a partir desse momento, o acesso às aplicações contratadas fica disponível.",
  },
  active: {
    title: "Contrato ativo",
    body: "As aplicações contratadas estão disponíveis para a sua organização durante o período do contrato.",
  },
  suspended: { title: "Contrato suspenso", body: "O contrato está suspenso. Contacte a Última Linha para regularizar a situação." },
  cancelled: { title: "Contrato cancelado", body: "Este contrato foi cancelado antes de ser ativado. Não dá acesso a nenhuma aplicação." },
  terminated: { title: "Contrato terminado", body: "Este contrato foi terminado. O acesso concedido por ele foi encerrado." },
  expired: { title: "Contrato expirado", body: "O período deste contrato terminou." },
};

export function contractStatusCopy(status: string): { title: string; body: string } {
  return STATUS_COPY[status] ?? { title: status, body: "Contacte a Última Linha para mais informação sobre este contrato." };
}

/**
 * The contract's items as frozen at acceptance. `items` (the contract rows)
 * carry quantities and money; the version snapshot carries the application
 * and plan each line refers to. ul-platform writes each contract item with
 * `sort` = its position in the snapshot's items (acceptance.service.ts,
 * `sort: snap.position`), so that is the join — not list order.
 */
export function contractLineItems(contract: ContractDetail): ProposalItemView[] {
  const snapshotItems = contract.snapshot?.items ?? [];
  return [...contract.items]
    .sort((a, b) => a.sort - b.sort)
    .map((item) => {
      const frozen = snapshotItems[item.sort];
      return {
        kind: item.kind,
        title: item.title,
        description: item.description,
        application: frozen?.application ? { name: frozen.application.name } : null,
        plan: frozen?.plan ? { name: frozen.plan.name } : null,
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        lineTotalMinor: item.lineTotalMinor,
        billingPeriod: item.billingPeriod,
        durationMonths: item.durationMonths,
      };
    });
}

/** The applications a contract covers (application_plan lines), by key — for showing their current access state. */
export function contractApplications(contract: ContractDetail): { key: string; name: string; plan: string | null }[] {
  const seen = new Map<string, { key: string; name: string; plan: string | null }>();
  for (const item of contract.snapshot?.items ?? []) {
    if (item.kind === "application_plan" && item.application && !seen.has(item.application.key)) {
      seen.set(item.application.key, { key: item.application.key, name: item.application.name, plan: item.plan?.name ?? null });
    }
  }
  return [...seen.values()];
}
