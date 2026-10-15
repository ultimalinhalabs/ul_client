/**
 * How a catalog plan's entitlements read to a client. Only keys whose meaning is defined by ul-platform /
 * Na Pista are translated; anything else is shown verbatim (never guessed). A `false` capability is not
 * listed as included.
 */
const fmt = new Intl.NumberFormat("pt-AO");

export function entitlementLabel(key: string, value: unknown): string | null {
  switch (key) {
    case "products.max":
      return typeof value === "number" ? `Até ${fmt.format(value)} produtos ativos` : null;
    case "members.max":
      return typeof value === "number" ? `Até ${fmt.format(value)} utilizadores na organização` : null;
    case "catalog.enabled":
      return value === true ? "Catálogo de produtos, stock e pedidos" : null;
    case "advanced_reports.enabled":
      return value === true ? "Relatórios avançados" : null;
    default:
      if (value === false) return null;
      return value === true ? key : `${key}: ${String(value)}`;
  }
}

export function periodLabel(days: number): string {
  return days === 1 ? "1 dia" : `${days} dias`;
}

/** One Idempotency-Key per plan for as long as the page is open: a retry replays the same offer. */
export function newContractingKey(): string {
  return `ss-${crypto.randomUUID()}`;
}
