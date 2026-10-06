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
