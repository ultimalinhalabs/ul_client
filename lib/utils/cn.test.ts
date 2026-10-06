import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("keeps a custom type-scale size and a text colour side by side", () => {
    const classes = cn("text-fg-inverse", "text-body").split(" ");
    expect(classes).toContain("text-fg-inverse");
    expect(classes).toContain("text-body");
  });

  it("still resolves a real conflict between two sizes", () => {
    expect(cn("text-body", "text-label")).toBe("text-label");
  });
});
