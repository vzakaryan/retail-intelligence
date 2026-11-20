import type { Metric } from "@/data/storeCompare";
import { fmtAmd, fmtPercent, fmtSignedPct } from "@/lib/format";

/** How each store-comparison measure is shown */
export function useMetricFormat() {
  return (m: Metric, v: number) =>
    m === "salesGrowth" ? fmtSignedPct(v, 1) : m === "impactPerWeek" ? fmtAmd(v, { thousands: true }) : m === "actedOn" ? fmtPercent(v, 0) : m === "writeOffsPct" ? fmtPercent(v, 2) : fmtPercent(v);
}
