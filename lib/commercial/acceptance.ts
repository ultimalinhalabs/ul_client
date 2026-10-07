import { ApiError, toHumanMessage } from "@/lib/api/errors";

/**
 * Block 2B — what the person should understand when an acceptance is
 * refused. The acceptance endpoint raises the generic 403 FORBIDDEN / 409
 * CONFLICT codes with specific English messages, so those exact messages
 * (copied from ul-platform src/modules/commercial/acceptance.service.ts) are
 * the stable keys here. Anything unknown falls back to the generic sentence
 * for its status — never the raw backend text.
 *
 * `reload`: the refusal means the proposal's state moved on (accepted,
 * expired, a new version) — the page must re-read it from the backend, which
 * stays the only authority on whether acceptance is still possible.
 */
const BY_MESSAGE: Record<string, { title: string; body: string; reload?: boolean }> = {
  "A verified email address is required": {
    title: "Confirme o seu email",
    body: "Só uma conta com o email confirmado pode aceitar uma proposta. Abra o link de confirmação que lhe enviámos.",
  },
  "Only an active OWNER of the organization can accept this proposal": {
    title: "Apenas o proprietário pode aceitar",
    body: "Para aceitar em nome de uma organização, tem de ser o seu proprietário (OWNER) ativo. Escolha outra organização ou crie uma nova.",
  },
  "Platform administrators cannot accept proposals on behalf of a client": {
    title: "Conta da equipa Última Linha",
    body: "Contas de administração da Última Linha não podem aceitar propostas em nome de um cliente.",
  },
  "Proposal acceptance is not available: the official consent statement is not configured": {
    title: "Aceitação online ainda indisponível",
    body: "A Última Linha está a concluir a validação do texto de consentimento. Entraremos em contacto para formalizar a aceitação.",
    reload: true,
  },
  "This proposal has already been accepted": { title: "Proposta já aceite", body: "Esta proposta já foi aceite.", reload: true },
  "This proposal version has expired": {
    title: "Proposta expirada",
    body: "O prazo de validade desta proposta terminou. Peça à Última Linha uma nova versão.",
    reload: true,
  },
  "The proposal content has changed; reload it before accepting": {
    title: "A proposta foi atualizada",
    body: "Existe uma versão mais recente. Reveja-a antes de aceitar.",
    reload: true,
  },
  "Only the currently sent proposal version can be accepted": {
    title: "A proposta foi atualizada",
    body: "Existe uma versão mais recente. Reveja-a antes de aceitar.",
    reload: true,
  },
  "The proposal terms do not match the sent version": {
    title: "A proposta foi atualizada",
    body: "Os termos mudaram desde que abriu a página. Reveja a versão atual antes de aceitar.",
    reload: true,
  },
  "This proposal is addressed to another organization": {
    title: "Organização diferente",
    body: "Esta proposta foi dirigida a outra organização. Escolha essa organização para aceitar.",
  },
  "Choose an organization you own, or create one, to accept this proposal": {
    title: "Escolha a organização",
    body: "Indique uma organização da qual é proprietário, ou crie uma nova, para aceitar a proposta.",
  },
  "This Idempotency-Key was already used for a different acceptance": {
    title: "Aceitação já registada",
    body: "Este pedido de aceitação já foi registado com outros dados. Atualizámos a página para mostrar o estado atual.",
    reload: true,
  },
};

export interface AcceptanceProblem {
  title: string;
  body: string;
  reload: boolean;
  /** Support reference (ul-platform's X-Request-ID), when the request reached the server. */
  reference: string | null;
}

export function describeAcceptanceError(error: unknown): AcceptanceProblem {
  if (error instanceof ApiError) {
    const reference = error.requestId ? `Referência: ${error.requestId}` : null;
    const known = BY_MESSAGE[error.message];
    if (known) return { title: known.title, body: known.body, reload: Boolean(known.reload), reference };
    if (error.status === 0) {
      return {
        title: "Sem ligação",
        body: "Não foi possível confirmar se a aceitação foi registada. Tente novamente: o mesmo pedido nunca é registado duas vezes.",
        reload: false,
        reference: null,
      };
    }
    if (error.status === 404) {
      return {
        title: "Proposta não encontrada para esta conta",
        body: "Confirme que entrou com o email para onde a Última Linha enviou a proposta.",
        reload: false,
        reference,
      };
    }
    if (error.status === 400) return { title: "Dados inválidos", body: "Verifique os campos do formulário.", reload: false, reference };
    return { title: "Não foi possível aceitar a proposta", body: toHumanMessage(error), reload: error.status === 409, reference };
  }
  return { title: "Não foi possível aceitar a proposta", body: toHumanMessage(error), reload: false, reference: null };
}

/**
 * One Idempotency-Key per proposal version, kept for the browser session:
 * a retry after a lost response (network failure) replays the SAME key and
 * gets the existing acceptance back (200) instead of a duplicate. Format per
 * ul-platform's idempotencyKeySchema: 8–200 of [A-Za-z0-9._:-].
 */
export function acceptanceKeyStorageId(proposalId: string, versionId: string) {
  return `ul-client:acceptance-key:${proposalId}:${versionId}`;
}

export function newAcceptanceKey(): string {
  return `acc-${crypto.randomUUID()}`;
}

export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,200}$/;
