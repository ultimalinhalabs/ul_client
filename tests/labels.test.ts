import { describe, expect, it } from "vitest";
import { statusLabel } from "@/components/ui/StatusBadge";
import { roleLabel } from "@/lib/labels";
import { toSignInMessage } from "@/app/login/LoginForm";

describe("business-language labels", () => {
  it("labels the four seeded roles and shows any other key verbatim", () => {
    expect(roleLabel("OWNER")).toBe("Proprietário");
    expect(roleLabel("staff")).toBe("Colaborador");
    expect(roleLabel("AUDITOR")).toBe("AUDITOR");
  });

  it("labels statuses regardless of the API's casing", () => {
    expect(statusLabel("active")).toBe("Ativo");
    expect(statusLabel("ACTIVE")).toBe("Ativo");
    expect(statusLabel("trialing")).toBe("Em período experimental");
  });
});

describe("toSignInMessage", () => {
  it("translates Supabase's credential error and never echoes the raw provider text", () => {
    expect(toSignInMessage({ message: "Invalid login credentials" })).toBe("Email ou palavra-passe incorretos.");
    expect(toSignInMessage({ code: "over_request_rate_limit", message: "x" })).toMatch(/demasiadas tentativas/i);
    expect(toSignInMessage({ message: "AuthRetryableFetchError: fetch failed" })).not.toContain("AuthRetryableFetchError");
  });
});
