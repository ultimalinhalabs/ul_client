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

const longDateFormatter = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" });

/** Block 2B — documents (proposal validity, contract dates): "31 de outubro de 2026". "—" for an unparseable value. */
export function formatLongDate(value: string | Date): string {
  const date = toDate(value);
  return date ? longDateFormatter.format(date) : "—";
}

/** Second precision, for audit trails, e.g. "30/09/2026, 14:05:09". */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "—";
}

/** True when the instant is not in the future (a validity date that has passed). Meant for request-time evaluation in a Server Component. */
export function isPastInstant(value: string | Date, now: number = Date.now()): boolean {
  const date = toDate(value);
  return date !== null && date.getTime() <= now;
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

const MINOR_PATTERN = /^-?\d+$/;

/**
 * Block 2B — money from ul-platform's minor-unit strings (AOA: 1 Kz = 100),
 * exact: the integer string is split with BigInt, never parsed into a float.
 * AOA renders as `1 850,50 Kz` (the format documented above); any other
 * currency keeps its ISO code as the suffix, e.g. `1 850,50 USD`. A value that
 * is not an integer string is returned untouched rather than guessed at.
 */
export function formatMoneyMinor(minor: string, currency: string): string {
  if (!MINOR_PATTERN.test(minor)) return minor;
  const value = BigInt(minor);
  const negative = value < BigInt(0);
  const absolute = negative ? -value : value;
  const units = absolute / BigInt(100);
  const cents = (absolute % BigInt(100)).toString().padStart(2, "0");
  const grouped = units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const suffix = currency === "AOA" ? "Kz" : currency;
  return `${negative ? "-" : ""}${grouped},${cents} ${suffix}`;
}
