/**
 * The one place the app formats values for display — every page used to
 * call `toLocaleString()` with whatever locale the browser had, so the same
 * timestamp read differently per operator. Always pt-AO, always 24h.
 *
 * Currency: this app shows no monetary values today. If one is ever added,
 * the Última Linha AOA format is `1 850,50 Kz` (space thousands separator,
 * comma decimals, "Kz" suffix) — reuse the product's existing formatter
 * rather than inventing another.
 */
const LOCALE = "pt-AO";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" });

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Day precision, e.g. "30/09/2026". Numeric month on purpose — identical in every runtime and aligns in table columns. "—" for an unparseable value. */
export function formatDate(value: string | Date): string {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "—";
}

/** Second precision, for audit trails, e.g. "30/09/2026, 14:05:09". */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "—";
}

/** A value suitable for `<time dateTime>` — the machine-readable half of the two above. */
export function toIsoString(value: string | Date): string | undefined {
  return toDate(value)?.toISOString();
}

const numberFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 20 });
const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * pt-AO grouping for a metered quantity, e.g. "1850.5" → "1 850,5" (no-break
 * space, comma decimals — the same separators as the AOA `1 850,50 Kz` rule).
 * Usage totals arrive as Postgres `numeric` strings, so the string itself is
 * formatted (exact decimal) rather than parsed into a float and rounded.
 * Anything that isn't a plain decimal is returned untouched; null → "0".
 */
export function formatQuantity(value: string | number | null): string {
  if (value === null) return "0";
  const text = String(value);
  return DECIMAL_PATTERN.test(text) ? numberFormatter.format(text as Intl.StringNumericLiteral) : text;
}
