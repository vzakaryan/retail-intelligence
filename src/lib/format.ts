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

/**
 * Compact AMD amount. Everything from 100K up is shown in millions so amounts
 * next to each other are easy to compare:
 * 1_420_000 → "AMD 1.42M", 610_000 → "AMD 0.61M", 49_300_000 → "AMD 49.3M", 85_000 → "AMD 85K"
 */
export function fmtAmd(value: number, opts: { fixed?: boolean; thousands?: boolean } = {}): string {
  const abs = Math.abs(value);
  if (abs === 0) return "AMD 0";
  // `thousands`: keep amounts under 1M in K so a table column reads consistently (115K, 97K, 2.8K)
  if (opts.thousands && abs < 1e6)
    return `AMD ${new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: abs < 1e4 ? 1 : 0 }).format(value / 1e3)}K`;
  // `fixed` keeps trailing zeros (3.0M) so amounts line up in table columns
  const n = (v: number, max: number) =>
    new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: max, minimumFractionDigits: opts.fixed ? max : 0 }).format(v);
  if (abs >= 1e9) return `AMD ${n(value / 1e9, 2)}B`;
  if (abs >= 1e5) return `AMD ${n(value / 1e6, abs < 1e7 && !opts.fixed ? 2 : 1)}M`;
  return `AMD ${n(value / 1e3, 0)}K`;
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

/** Signed percent change: -18 → "−18%", 4.2 → "+4.2%" */
export function fmtSignedPct(delta: number, digits = 0): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${fmtNumber(Math.abs(delta), digits)}%`;
}

const arrow = (d: number) => (d > 0 ? "↑" : d < 0 ? "↓" : "");

/** KPI delta in percentage points with an arrow: 0.9 → "↑ 0.9 pp" */
export function fmtDeltaPp(delta: number, digits = 1): string {
  return `${arrow(delta)} ${fmtNumber(Math.abs(delta), digits)} pp`.trim();
}

/** KPI delta in percent with an arrow: -8.5 → "↓ 8.5%" */
export function fmtDeltaPct(delta: number, digits = 1): string {
  return `${arrow(delta)} ${fmtNumber(Math.abs(delta), digits)}%`.trim();
}
