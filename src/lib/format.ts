import { currentLocale } from "@/i18n";

/**
 * Locale-aware formatters. Components must use these instead of
 * toFixed()/toLocaleString() so Armenian formatting can be added in one place.
 */

export function fmtNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat(currentLocale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** 95.8 → "95.8%" */
export function fmtPercent(value: number, digits = 1): string {
  return new Intl.NumberFormat(currentLocale(), {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);
}

/** 1_420_000 → "AMD 1.42M", 49_300_000 → "AMD 49.3M", 85_000 → "AMD 85K" */
export function fmtAmd(value: number): string {
  const abs = Math.abs(value);
  const compact = new Intl.NumberFormat(currentLocale(), {
    notation: "compact",
    maximumFractionDigits: abs >= 1e6 && abs < 1e7 ? 2 : 1,
  }).format(value);
  return `AMD ${compact}`;
}

/** Full amount without abbreviation: 5600000 → "AMD 5,600,000" */
export function fmtAmdFull(value: number): string {
  return `AMD ${fmtNumber(value)}`;
}

/** Percentage-point delta: 1.2 → "+1.2 pp" */
export function fmtPp(delta: number, digits = 1): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${fmtNumber(Math.abs(delta), digits)} pp`;
}

export function fmtDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(currentLocale(), options).format(date);
}
