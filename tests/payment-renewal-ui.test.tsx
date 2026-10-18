import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/lib/store/toastStore";

vi.mock("@/lib/supabase/client", () => ({ getBrowserAccessToken: vi.fn().mockResolvedValue("user-access-token") }));

const { PaymentSection } = await import("@/components/commercial/PaymentSection");
const { RenewalSection } = await import("@/components/commercial/RenewalSection");

const API = "http://localhost:4000/v1";
const C = "/organizations/org-a/contracts/c-1";

type Call = { method: string; path: string; headers: Record<string, string>; body: unknown };
let calls: Call[];
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-request-id": "req_pay" } });
}
function mockApi(routes: Record<string, (() => Response)[]>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      const url = input.replace(API, "");
      const path = url.split("?")[0]!;
      const headers = (init.headers ?? {}) as Record<string, string>;
      calls.push({ method, path: url, headers, body: init.body instanceof Blob ? init.body : init.body ? JSON.parse(String(init.body)) : undefined });
      const queue = routes[`${method} ${path}`];
      const next = queue && queue.length > 1 ? queue.shift() : queue?.[0];
      if (!next) throw new Error(`Unexpected request ${method} ${url}`);
      return next();
    }),
  );
}
function renderUi(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const instructions = (over: Record<string, unknown> = {}) => ({
  target: { kind: "contract", contractId: "c-1", renewalId: null, reference: "UL-C-2026-000123", amountMinor: "2500000", currency: "AOA", dueAt: null },
  methods: { bankTransfer: { bankName: "Banco Teste", accountHolder: "Última Linha, Lda", iban: "AO06 0040 0000 1234 5678 9012 3" }, multicaixaExpress: { number: "923 000 000" } },
  proof: { required: true, contentType: "application/pdf", maxBytes: 4194304 },
  ...over,
});
const pdf = () => new File(["%PDF-1.4 teste"], "talão.pdf", { type: "application/pdf" });

beforeEach(() => {
  calls = [];
  useToastStore.setState({ toasts: [] });
});
afterEach(() => vi.unstubAllGlobals());

describe("payment section — pay by IBAN or Multicaixa Express, then upload the PDF (ul-platform 0027)", () => {
  it("shows the amount, the reference and both configured methods from the platform", async () => {
    mockApi({ [`GET ${C}/payment-instructions`]: [() => json(200, { data: instructions() })] });
    renderUi(<PaymentSection organizationId="org-a" contractId="c-1" renewalId={null} proofs={[]} title="Pagamento" />);
    expect(await screen.findByText("25 000,00 Kz")).toBeInTheDocument();
    expect(screen.getByText("UL-C-2026-000123")).toBeInTheDocument();
    expect(screen.getByText("AO06 0040 0000 1234 5678 9012 3")).toBeInTheDocument();
    expect(screen.getByText("923 000 000")).toBeInTheDocument();
    expect(screen.getByText(/só é ativado \(ou renovado\) depois de a Última Linha confirmar/)).toBeInTheDocument();
  });

  it("uploads the PDF as the raw body with the method and reference in the query", async () => {
    mockApi({
      [`GET ${C}/payment-instructions`]: [() => json(200, { data: instructions() })],
      [`POST ${C}/payment-proofs`]: [() => json(201, { data: { proof: { id: "p-1", status: "submitted" }, replayed: false } })],
    });
    renderUi(<PaymentSection organizationId="org-a" contractId="c-1" renewalId={null} proofs={[]} title="Pagamento" />);
    await screen.findByText("25 000,00 Kz");
    await userEvent.selectOptions(screen.getByLabelText("Como pagou"), "multicaixa_express");
    await userEvent.type(screen.getByLabelText("ID da operação Multicaixa Express"), "MCX-998877");
    await userEvent.upload(screen.getByLabelText("Comprovativo (PDF, até 4 MB)"), pdf());
    await userEvent.click(screen.getByRole("button", { name: "Enviar comprovativo" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    const post = calls.find((c) => c.method === "POST")!;
    const query = new URLSearchParams(post.path.split("?")[1]);
    expect(query.get("method")).toBe("multicaixa_express");
    expect(query.get("reference")).toBe("MCX-998877");
    expect(query.get("fileName")).toBe("talão.pdf");
    expect(query.get("renewalId")).toBeNull();
    expect(post.headers["Content-Type"]).toBe("application/pdf");
    expect(post.body).toBeInstanceOf(Blob);
    await waitFor(() => expect(useToastStore.getState().toasts.some((t) => /Comprovativo enviado/.test(t.message))).toBe(true));
  });

  it("refuses a non-PDF or a file over 4 MB before sending anything", async () => {
    mockApi({ [`GET ${C}/payment-instructions`]: [() => json(200, { data: instructions() })] });
    renderUi(<PaymentSection organizationId="org-a" contractId="c-1" renewalId={null} proofs={[]} title="Pagamento" />);
    await screen.findByText("25 000,00 Kz");
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "grande.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText("Comprovativo (PDF, até 4 MB)"), big);
    expect(await screen.findByText("O PDF tem mais de 4 MB.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar comprovativo" })).toBeDisabled();
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0);
  });

  it("explains the platform's refusal in Portuguese (not a PDF)", async () => {
    mockApi({
      [`GET ${C}/payment-instructions`]: [() => json(200, { data: instructions() })],
      [`POST ${C}/payment-proofs`]: [() => json(415, { error: { code: "PROOF_NOT_PDF", message: "The file is not a PDF" } })],
    });
    renderUi(<PaymentSection organizationId="org-a" contractId="c-1" renewalId={null} proofs={[]} title="Pagamento" />);
    await screen.findByText("25 000,00 Kz");
    await userEvent.type(screen.getByLabelText("Referência da transferência"), "TRF-1");
    await userEvent.upload(screen.getByLabelText("Comprovativo (PDF, até 4 MB)"), pdf());
    await userEvent.click(screen.getByRole("button", { name: "Enviar comprovativo" }));
    expect(await screen.findByText("O ficheiro não é um PDF. Envie o comprovativo em formato PDF.")).toBeInTheDocument();
  });

  it("lists the proofs sent for this period, with the reason when one was not accepted", async () => {
    mockApi({ [`GET ${C}/payment-instructions`]: [() => json(200, { data: instructions() })] });
    const proofs = [
      { id: "p-1", contractId: "c-1", renewalId: null, method: "bank_transfer" as const, declaredReference: "TRF-1", fileName: "talao.pdf", sizeBytes: 100, status: "rejected" as const, rejectionReason: "Valor diferente do contrato.", reviewedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
      { id: "p-2", contractId: "c-1", renewalId: "r-9", method: "bank_transfer" as const, declaredReference: "TRF-R", fileName: "renovacao.pdf", sizeBytes: 100, status: "submitted" as const, rejectionReason: null, reviewedAt: null, createdAt: new Date().toISOString() },
    ];
    renderUi(<PaymentSection organizationId="org-a" contractId="c-1" renewalId={null} proofs={proofs} title="Pagamento" />);
    expect(await screen.findByText("talao.pdf")).toBeInTheDocument();
    expect(screen.getByText("Motivo: Valor diferente do contrato.")).toBeInTheDocument();
    expect(screen.getByText("Não aceite")).toBeInTheDocument();
    expect(screen.queryByText("renovacao.pdf")).not.toBeInTheDocument();
  });

  it("without configured payment details, tells the client to contact UL with the reference", async () => {
    mockApi({ [`GET ${C}/payment-instructions`]: [() => json(200, { data: instructions({ methods: { bankTransfer: null, multicaixaExpress: null } }) })] });
    renderUi(<PaymentSection organizationId="org-a" contractId="c-1" renewalId={null} proofs={[]} title="Pagamento" />);
    expect(await screen.findByText("Dados de pagamento indisponíveis")).toBeInTheDocument();
  });
});

describe("renewal section (ul-platform 0026)", () => {
  const offerState = {
    eligible: true,
    ineligibleReason: null,
    leadDays: 7,
    authorization: null,
    offer: { consentText: "Autorizo a renovação do plano por períodos de 30 dias… não é uma cobrança automática…", consentSha256: "a".repeat(64), amountMinor: "2500000", currency: "AOA", periodDays: 30, leadDays: 7 },
    renewals: [],
  };

  it("authorizes only after the person ticks the exact text; sends its hash with an Idempotency-Key", async () => {
    mockApi({ [`POST ${C}/renewal-authorization`]: [() => json(201, { data: { id: "a-1" } })] });
    renderUi(<RenewalSection organizationId="org-a" contractId="c-1" renewal={offerState} />);
    const button = screen.getByRole("button", { name: "Autorizar renovação" });
    expect(button).toBeDisabled();
    await userEvent.click(screen.getByLabelText(/não é uma cobrança automática/));
    await userEvent.click(button);
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]!.body).toEqual({ consent: true, consentSha256: "a".repeat(64) });
    expect(calls[0]!.headers["Idempotency-Key"]).toMatch(/^renewal-/);
  });

  it("with a standing authorization: shows its terms and lets the OWNER withdraw it after confirming", async () => {
    mockApi({ [`POST ${C}/renewal-authorization/withdrawal`]: [() => json(200, { data: { withdrawn: true, cancelledRenewalId: "r-1" } })] });
    const state = {
      ...offerState,
      offer: null,
      authorization: { id: "a-1", contractId: "c-1", amountMinor: "2500000", currency: "AOA", periodDays: 30, consentText: "Texto autorizado", consentSha256: "a".repeat(64), authorizedAt: new Date().toISOString(), withdrawnAt: null },
      renewals: [
        { id: "r-1", contractId: "c-1", sequence: 1, reference: "UL-C-2026-000123-R1", status: "awaiting_payment" as const, periodStartsAt: new Date().toISOString(), periodEndsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(), amountMinor: "2500000", currency: "AOA", appliedAt: null, cancelledAt: null, lapsedAt: null, createdAt: new Date().toISOString() },
      ],
    };
    renderUi(<RenewalSection organizationId="org-a" contractId="c-1" renewal={state} />);
    expect(screen.getByText(/períodos de 30 dias, a 25 000,00 Kz por período/)).toBeInTheDocument();
    expect(screen.getByText("UL-C-2026-000123-R1")).toBeInTheDocument();
    expect(screen.getByText("A aguardar pagamento")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retirar autorização" }));
    const confirm = await screen.findAllByRole("button", { name: "Retirar autorização" });
    await userEvent.click(confirm[confirm.length - 1]!);
    await waitFor(() => expect(calls.some((c) => c.path.endsWith("/renewal-authorization/withdrawal"))).toBe(true));
    await waitFor(() => expect(useToastStore.getState().toasts.some((t) => /renovação pendente foi cancelada/.test(t.message))).toBe(true));
  });

  it("renders nothing for a contract that cannot be renewed and has no history", () => {
    const { container } = renderUi(<RenewalSection organizationId="org-a" contractId="c-1" renewal={{ ...offerState, eligible: false, ineligibleReason: "CONTRACT_NOT_ACTIVE", offer: null }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
