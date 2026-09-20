import { render, screen, waitFor } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const signOut = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut } }),
}));

const { Providers } = await import("@/app/providers");

function Probe({ error }: { error: ApiError }) {
  const { isError } = useQuery({
    queryKey: ["probe", error.status],
    queryFn: () => Promise.reject(error),
    retry: false,
  });
  return <div>{isError ? "errored" : "loading"}</div>;
}

describe("Providers session handling (F17 brief, Fase 2/17)", () => {
  it("signs out and redirects to /login on a 401 from any query", async () => {
    push.mockClear();
    signOut.mockClear();

    render(
      <Providers>
        <Probe error={new ApiError(401, "UNAUTHORIZED", "Invalid or expired access token")} />
      </Providers>,
    );

    await screen.findByText("errored");
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });

  it("never signs out or redirects on a 403 — authenticated but not authorized (wrong org, missing permission) is not a session problem", async () => {
    push.mockClear();
    signOut.mockClear();

    render(
      <Providers>
        <Probe error={new ApiError(403, "FORBIDDEN", "No active membership in this organization")} />
      </Providers>,
    );

    await screen.findByText("errored");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(signOut).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("never signs out or redirects on a 500 — an unexpected server error is not a session problem either", async () => {
    push.mockClear();
    signOut.mockClear();

    render(
      <Providers>
        <Probe error={new ApiError(500, "INTERNAL_ERROR", "Unexpected server error")} />
      </Providers>,
    );

    await screen.findByText("errored");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(signOut).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
