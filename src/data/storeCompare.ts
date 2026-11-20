import { excessKpi, getImpact } from "./impact";
import { getStoreDay } from "./today";
import { HIGH_ADOPTION_PCT, STORES } from "./world";
import type { Store } from "./types";

/**
 * Head-office comparison of stores (step 21). Every number is the same one the
 * store manager sees on My store today / Your results so far / Overstock, so a
 * row here always matches the store's own pages. Rates and growth (not raw AMD)
 * so big and small stores compare fairly. Period: last 4 weeks.
 */

export interface StoreRow {
  store: Store;
  /** Net sales growth vs. the 4 weeks before, % */
  salesGrowth: number;
  netSales4w: number;
  /** Out-of-stock rate, % */
  oos: number;
  /** Write-offs as % of net sales */
  writeOffsPct: number;
  /** Extra stock as % of all stock */
  extraPct: number;
  /** Suggestions acted on, % */
  actedOn: number;
  /** Estimated impact since go-live (recovered sales + write-offs avoided), AMD */
  impact: number;
  /** Same, per week since go-live */
  impactPerWeek: number;
  weeks: number;
}

export type Metric = "salesGrowth" | "oos" | "writeOffsPct" | "extraPct" | "actedOn" | "impactPerWeek";
/** Whether a higher value is better */
export const HIGHER_IS_BETTER: Record<Metric, boolean> = { salesGrowth: true, oos: false, writeOffsPct: false, extraPct: false, actedOn: true, impactPerWeek: true };

const r1 = (v: number) => Math.round(v * 10) / 10;

let rows: StoreRow[] | undefined;
export function storeRows(): StoreRow[] {
  if (rows) return rows;
  rows = STORES.map((store) => {
    const k = getStoreDay(store.id).kpis["4w"];
    const im = getImpact(store.id);
    const { now, prev } = k.sales;
    return {
      store,
      salesGrowth: r1(((now.netSales - prev.netSales) / prev.netSales) * 100),
      netSales4w: now.netSales,
      oos: r1(100 - k.availability.value),
      writeOffsPct: Math.round((k.writeOffs.value / now.netSales) * 10000) / 100,
      extraPct: excessKpi(store.id, 4).share,
      actedOn: store.kpis.suggestionsActedOn,
      impact: im.total,
      impactPerWeek: Math.round(im.total / Math.max(1, im.weeks) / 1000) * 1000,
      weeks: im.weeks,
    };
  });
  return rows;
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

/** Chain average of a metric (sales-weighted where it's a share of sales). */
export function chainAverage(list: StoreRow[], m: Metric): number {
  return avg(list.map((r) => r[m]));
}

/** How far from the chain average a store must be to count as clearly better / worse */
const MARGIN: Record<Metric, (avg: number) => number> = {
  salesGrowth: () => 1, // percentage points
  oos: () => 0.5,
  writeOffsPct: () => 0.08,
  extraPct: () => 0.5,
  actedOn: () => 5,
  impactPerWeek: (avg) => Math.abs(avg) * 0.1, // 10%
};

/** Tone of a cell compared with the chain average: clearly better → good, clearly worse → bad, else neutral. */
export function compareTone(value: number, average: number, m: Metric): "good" | "bad" | "neutral" {
  const diff = value - average;
  if (Math.abs(diff) <= MARGIN[m](average)) return "neutral";
  return diff > 0 === HIGHER_IS_BETTER[m] ? "good" : "bad";
}

/** Chain totals for the key numbers and the "before → now" card. */
export function chainSummary() {
  const list = storeRows();
  const days = STORES.map((s) => getStoreDay(s.id).kpis);
  const impacts = STORES.map((s) => getImpact(s.id));
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const salesNow = sum(days.map((k) => k["4w"].sales.now.netSales));
  const salesPrev = sum(days.map((k) => k["4w"].sales.prev.netSales));
  const high = list.filter((r) => r.actedOn >= HIGH_ADOPTION_PCT);
  const rest = list.filter((r) => r.actedOn < HIGH_ADOPTION_PCT);
  const firstGoLive = new Date(Math.min(...STORES.map((s) => s.goLive.getTime())));
  return {
    netSales4w: salesNow,
    salesGrowth: r1(((salesNow - salesPrev) / salesPrev) * 100),
    oos: { before: r1(avg(impacts.map((i) => i.oosRate.before))), now: r1(avg(impacts.map((i) => i.oosRate.now))) },
    actedOn: Math.round(avg(list.map((r) => r.actedOn))),
    lowAdoption: list.filter((r) => r.actedOn < 70).length,
    value: sum(impacts.map((i) => i.total)),
    firstGoLive,
    // Weekly figures, before go-live vs. this week (summed over all stores)
    beforeNow: {
      lostSales: { before: sum(impacts.map((i) => i.lostSales.before)), now: sum(impacts.map((i) => i.lostSales.now)) },
      writeOffs: { before: sum(impacts.map((i) => i.writeOffs.before)), now: sum(impacts.map((i) => i.writeOffs.now)) },
      excess: { before: sum(impacts.map((i) => i.excess.before)), now: sum(impacts.map((i) => i.excess.now)) },
      netSales: { before: sum(impacts.map((i) => i.netSales.before)), now: sum(impacts.map((i) => i.netSales.now)) },
    },
    adoption: {
      high: { count: high.length, perWeek: avg(high.map((r) => r.impactPerWeek)) },
      rest: { count: rest.length, perWeek: avg(rest.map((r) => r.impactPerWeek)) },
    },
  };
}
