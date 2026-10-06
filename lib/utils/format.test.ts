import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatQuantity, toIsoString } from "./format";

describe("format", () => {
  // A local-time Date, so the assertions hold in any test-runner timezone.
  const date = new Date(2026, 8, 30, 14, 5, 9);

  it("formats a day as dd/mm/yyyy", () => {
    expect(formatDate(date)).toBe("30/09/2026");
  });

  it("formats a timestamp with 24h seconds", () => {
    expect(formatDateTime(date)).toBe("30/09/2026, 14:05:09");
  });

  it("returns an em dash, never 'Invalid Date', for an unparseable value", () => {
    expect(formatDate("not-a-date")).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
    expect(toIsoString("not-a-date")).toBeUndefined();
  });
});

describe("formatQuantity", () => {
  it("groups with a no-break space and uses a decimal comma", () => {
    expect(formatQuantity("1850.5")).toBe("1 850,5");
  });

  it("formats a large Postgres numeric string exactly, without float rounding", () => {
    expect(formatQuantity("12345678901234567.25")).toBe("12 345 678 901 234 567,25");
  });

  it("treats a missing total as zero and leaves non-numeric text untouched", () => {
    expect(formatQuantity(null)).toBe("0");
    expect(formatQuantity("n/a")).toBe("n/a");
  });
});
