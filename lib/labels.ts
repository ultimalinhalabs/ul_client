/**
 * Business-language labels for API identifiers the tenant sees. The API's
 * own key is always what gets sent back — these are display-only, and an
 * unknown key is shown verbatim rather than guessed at.
 *
 * Roles are ul-platform's seeded OWNER/ADMIN/MANAGER/STAFF (CLAUDE.md §6).
 * Never branch on these for authorization — gates check permission keys.
 */
const ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  STAFF: "Colaborador",
};

export function roleLabel(roleKey: string): string {
  return ROLE_LABELS[roleKey.toUpperCase()] ?? roleKey;
}

/** Block 2B — commercial vocabulary (ul-platform src/modules/commercial/schemas.ts). Display only; unknown keys verbatim. */
const BILLING_PERIOD_LABELS: Record<string, string> = {
  one_time: "Pagamento único",
  monthly: "Mensal",
  yearly: "Anual",
};

export function billingPeriodLabel(period: string): string {
  return BILLING_PERIOD_LABELS[period] ?? period;
}

/** The unit a recurring amount is charged in, next to the amount itself ("/ mês"); null for a one-time charge. */
export function billingPeriodSuffix(period: string): string | null {
  if (period === "monthly") return "/ mês";
  if (period === "yearly") return "/ ano";
  return null;
}

const ITEM_KIND_LABELS: Record<string, string> = {
  application_plan: "Plano de aplicação",
  service: "Serviço",
  support: "Suporte",
  one_off: "Serviço pontual",
  custom: "Personalizado",
};

export function itemKindLabel(kind: string): string {
  return ITEM_KIND_LABELS[kind] ?? kind;
}

/** "12 meses", "1 mês"; null when the item has no fixed duration. */
export function durationLabel(months: number | null, days?: number | null): string | null {
  if (days != null) return days === 1 ? "1 dia" : `${days} dias`;
  if (months === null) return null;
  return months === 1 ? "1 mês" : `${months} meses`;
}
