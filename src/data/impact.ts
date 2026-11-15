import { getExpiry } from "./expiry";
import { extraValue, getOverstock } from "./overstock";
import { getStockouts } from "./stockouts";
import { getStoreDay } from "./today";
import { getStore, weeksSinceGoLive } from "./world";

/**
 * Numbers for "Your results so far" and the stock KPIs on "My store today".
 *
 * Everything is derived from data other screens already show, so the numbers
 * match: the weekly trend charts on Stockout risk / Expiry / Overstock (their
 * first `before` weeks are before the store's go-live) and this week's KPIs.
 *
 * - Recovered sales: lost sales move with the out-of-stock rate. Each week since
 *   go-live, the drop in OOS rate vs. the "before" average × (lost sales per
 *   OOS point) is a sale that was not lost.
 * - Write-offs avoided: each week since go-live, "before" weekly average minus
 *   that week's write-offs.
 * - Estimated impact = recovered sales + write-offs avoided. Less excess stock
 *   frees up money but is not extra profit, so it is shown on its own.
 */

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const round = (v: number, step: number) => Math.round(v / step) * step;

/** Value of stock above target right now (same total as the Overstock page). */
export function excessNow(storeId: string): number {
  return getOverstock(storeId).rows.reduce((s, r) => s + extraValue(r), 0);
}

/** Excess stock now, change vs. 1 or 4 weeks ago (%), and days of stock vs. target. */
export function excessKpi(storeId: string, weeksBack: 1 | 4) {
  const data = getOverstock(storeId);
  const now = excessNow(storeId);
  const v = data.trend.values;
  const then = v[v.length - 1 - weeksBack] * (now / v[v.length - 1]);
  return { value: now, delta: Math.round(((now - then) / then) * 1000) / 10, days: data.daysOfStock.value, target: data.daysOfStock.target };
}

/**
 * Recovered sales in one week (same method as the total in getImpact):
 * drop in OOS rate vs. the "before" average × lost sales per OOS point.
 * `value` = this week, `prev` = last week.
 */
export function recoveredWeek(storeId: string) {
  const week = getStoreDay(storeId).kpis.week;
  const oos = getStockouts(storeId).trend;
  const oosBefore = avg(oos.values.slice(0, oos.before));
  const lostPerPoint = week.lostSales.value / (100 - week.availability.value);
  const at = (v: number) => round(Math.max(0, oosBefore - v) * lostPerPoint, 10_000);
  const v = oos.values;
  return { value: at(v[v.length - 1]), prev: at(v[v.length - 2]) };
}

export interface BeforeNow {
  before: number;
  now: number;
}

export interface StoreImpact {
  goLive: Date;
  weeks: number;
  recoveredSales: number;
  writeOffsAvoided: number;
  total: number;
  oosRate: BeforeNow;
  /** AMD per week */
  lostSales: BeforeNow;
  /** AMD per week */
  writeOffs: BeforeNow;
  /** AMD, stock above target */
  excess: BeforeNow;
  onlineComplete: BeforeNow;
  actedOnPct: number;
}

const cache = new Map<string, StoreImpact>();

export function getImpact(storeId: string): StoreImpact {
  const hit = cache.get(storeId);
  if (hit) return hit;

  const store = getStore(storeId);
  const week = getStoreDay(storeId).kpis.week;

  // Out-of-stock rate and lost sales
  const oos = getStockouts(storeId).trend;
  const oosBefore = avg(oos.values.slice(0, oos.before));
  const oosNow = 100 - week.availability.value;
  const lostPerPoint = week.lostSales.value / oosNow;
  const recovered = oos.values.slice(oos.before).reduce((s, v) => s + Math.max(0, oosBefore - v) * lostPerPoint, 0);

  // Write-offs
  const wo = getExpiry(storeId).trend;
  const woBefore = avg(wo.values.slice(0, wo.before));
  const avoided = wo.values.slice(wo.before).reduce((s, v) => s + Math.max(0, woBefore - v), 0);

  // Excess stock (trend values are rescaled to today's total so "now" matches the Overstock page)
  const ex = getOverstock(storeId).trend;
  const exNow = excessNow(storeId);
  const exBefore = avg(ex.values.slice(0, ex.before)) * (exNow / ex.values[ex.values.length - 1]);

  const recoveredSales = round(recovered, 10_000);
  const writeOffsAvoided = round(avoided, 10_000);
  const impact: StoreImpact = {
    goLive: store.goLive,
    weeks: weeksSinceGoLive(store.goLive),
    recoveredSales,
    writeOffsAvoided,
    total: recoveredSales + writeOffsAvoided,
    oosRate: { before: Math.round(oosBefore * 10) / 10, now: Math.round(oosNow * 10) / 10 },
    lostSales: { before: round(oosBefore * lostPerPoint, 10_000), now: week.lostSales.value },
    writeOffs: { before: round(woBefore, 10_000), now: week.writeOffs.value },
    excess: { before: round(exBefore, 10_000), now: exNow },
    onlineComplete: { before: getStoreDay(storeId).results.onlineCompleteBefore, now: week.onlineComplete.value },
    actedOnPct: store.kpis.suggestionsActedOn,
  };
  cache.set(storeId, impact);
  return impact;
}
