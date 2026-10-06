import {
  Blocks,
  CreditCard,
  Gauge,
  KeyRound,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  SlidersHorizontal,
  Users,
  Webhook,
} from "lucide-react";

export interface NavItem {
  /** Path segment under /app/o/[organizationId]/. */
  segment: string;
  label: string;
  icon: LucideIcon;
  /** Extra words the command menu matches on (incl. English terms users may still type). */
  keywords?: string;
}

export interface NavGroup {
  /** null for the ungrouped entry point at the top. */
  label: string | null;
  items: NavItem[];
}

/**
 * The single source of the app's information architecture — sidebar, mobile
 * drawer and command menu all render this. Grouped by what a business is
 * doing (its team, its plan, its integrations), not by API resource.
 *
 * Every item stays visible regardless of the caller's permissions: the API
 * is the authority, and a page the role can't read renders an explicit
 * permission state (ErrorAlert on 403) rather than silently disappearing.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ segment: "dashboard", label: "Início", icon: LayoutDashboard, keywords: "dashboard painel visao geral" }],
  },
  {
    label: "Organização",
    items: [
      { segment: "members", label: "Membros", icon: Users, keywords: "members equipa utilizadores pessoas" },
      { segment: "settings", label: "Definições", icon: Settings, keywords: "settings conta organizacao" },
    ],
  },
  {
    label: "Plano",
    items: [
      { segment: "applications", label: "Aplicações", icon: Blocks, keywords: "applications produtos acesso" },
      { segment: "subscriptions", label: "Subscrições", icon: CreditCard, keywords: "subscriptions assinaturas planos" },
      { segment: "entitlements", label: "Limites do plano", icon: SlidersHorizontal, keywords: "entitlements funcionalidades" },
      { segment: "usage", label: "Consumo", icon: Gauge, keywords: "usage uso utilizacao" },
    ],
  },
  {
    label: "Integrações",
    items: [
      { segment: "api-keys", label: "Chaves de API", icon: KeyRound, keywords: "api keys credenciais tokens" },
      { segment: "webhooks", label: "Webhooks", icon: Webhook, keywords: "webhooks eventos notificacoes" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function organizationHref(organizationId: string, segment: string) {
  return `/app/o/${organizationId}/${segment}`;
}

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
