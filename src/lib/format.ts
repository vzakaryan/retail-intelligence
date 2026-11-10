import { currentLocale } from "@/i18n";

/**
 * Locale-aware formatters. Components must use these instead of
 * toFixed()/toLocaleString() so Armenian formatting lives in one place.
 *
 * Armenian is formatted by hand: many browsers ship without Armenian (hy-AM)
 * locale data and silently fall back to US English.
 * Armenian style: decimal comma, narrow space between thousands ("1 234,5").
 */

const isHy = () => currentLocale().startsWith("hy");
const NNBSP = "\u202F";

/** Formats with en-US rules, then converts separators for Armenian. */
function num(value: number, opts: Intl.NumberFormatOptions): string {
  const en = new Intl.NumberFormat("en-US", opts).format(value);
  if (!isHy()) return en;
  return en.replace(/,/g, "\u0000").replace(/\./g, ",").replace(/\u0000/g, NNBSP);
}

export function fmtNumber(value: number, digits = 0): string {
  return num(value, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** 95.8 → "95.8%" / "95,8%" */
export function fmtPercent(value: number, digits = 1): string {
  return `${fmtNumber(value, digits)}%`;
}

/** Money label: "AMD 1.42M" in English, "1,42 մլն ֏" / "310 հազ. ֏" in Armenian. */
function money(num: string, unit: "" | "K" | "M" | "B"): string {
  if (!isHy()) return `AMD ${num}${unit}`;
  const hyUnit = { "": "", K: " հազ.", M: " մլն", B: " մլրդ" }[unit];
  return `${num}${hyUnit} ֏`;
}

/**
 * Compact AMD amount. Everything from 100K up is shown in millions so amounts
 * next to each other are easy to compare:
 * 1_420_000 → "AMD 1.42M", 610_000 → "AMD 0.61M", 49_300_000 → "AMD 49.3M", 85_000 → "AMD 85K"
 */
export function fmtAmd(value: number, opts: { fixed?: boolean; thousands?: boolean } = {}): string {
  const abs = Math.abs(value);
  if (abs === 0) return money("0", "");
  const n = (v: number, max: number) => num(v, { maximumFractionDigits: max, minimumFractionDigits: opts.fixed ? max : 0 });
  // `thousands`: keep amounts under 1M in K so a table column reads consistently (115K, 97K, 2.8K)
  if (opts.thousands && abs < 1e6) return money(num(value / 1e3, { maximumFractionDigits: abs < 1e4 ? 1 : 0 }), "K");
  if (abs >= 1e9) return money(n(value / 1e9, 2), "B");
  if (abs >= 1e5) return money(n(value / 1e6, abs < 1e7 && !opts.fixed ? 2 : 1), "M");
  return money(n(value / 1e3, 0), "K");
}

/** Full amount without abbreviation: 5600000 → "AMD 5,600,000" / "5 600 000 ֏" */
export function fmtAmdFull(value: number): string {
  return money(fmtNumber(value), "");
}

const ppUnit = () => (isHy() ? "տ.կ." : "pp");

/** Percentage-point delta: 1.2 → "+1.2 pp" */
export function fmtPp(delta: number, digits = 1): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${fmtNumber(Math.abs(delta), digits)} ${ppUnit()}`;
}

const HY_WEEKDAY_LONG = ["կիրակի", "երկուշաբթի", "երեքշաբթի", "չորեքշաբթի", "հինգշաբթի", "ուրբաթ", "շաբաթ"];
const HY_WEEKDAY_SHORT = ["կիր", "երկ", "երք", "չրք", "հնգ", "ուրբ", "շբթ"];
const HY_MONTH_LONG = ["հունվարի", "փետրվարի", "մարտի", "ապրիլի", "մայիսի", "հունիսի", "հուլիսի", "օգոստոսի", "սեպտեմբերի", "հոկտեմբերի", "նոյեմբերի", "դեկտեմբերի"];
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Dates. Armenian style is "երեքշաբթի, նոյեմբերի 10" (weekday, month in the genitive, day);
 * times are always 24-hour "16:00".
 */
export function fmtDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  if (!isHy()) return new Intl.DateTimeFormat("en-US", options).format(date);
  const parts: string[] = [];
  if (options.weekday) parts.push((options.weekday === "long" ? HY_WEEKDAY_LONG : HY_WEEKDAY_SHORT)[date.getDay()]);
  // Month first, in the genitive: "նոյեմբերի 10" (approved by the user)
  const dm: string[] = [];
  if (options.month) dm.push(HY_MONTH_LONG[date.getMonth()]);
  if (options.day) dm.push(String(date.getDate()));
  if (dm.length) parts.push(dm.join(" "));
  if (options.hour) parts.push(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
  return parts.join(", ");
}

/** Signed percent change: -18 → "−18%", 4.2 → "+4.2%" */
export function fmtSignedPct(delta: number, digits = 0): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${fmtNumber(Math.abs(delta), digits)}%`;
}

const arrow = (d: number) => (d > 0 ? "↑" : d < 0 ? "↓" : "");

/** KPI delta in percentage points with an arrow: 0.9 → "↑ 0.9 pp" */
export function fmtDeltaPp(delta: number, digits = 1): string {
  return `${arrow(delta)} ${fmtNumber(Math.abs(delta), digits)} ${ppUnit()}`.trim();
}

/** KPI delta in percent with an arrow: -8.5 → "↓ 8.5%" */
export function fmtDeltaPct(delta: number, digits = 1): string {
  return `${arrow(delta)} ${fmtNumber(Math.abs(delta), digits)}%`.trim();
}
