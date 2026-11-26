import type { NewTask } from "./stockouts";
import { getStoreDay } from "./today";
import { getStore, trendWeeksBefore } from "./world";

/**
 * Online orders per store — docs/design-references/approved/09–10.
 * Each "prepare before picking" item is backed by a task on "My store today",
 * so ticking it off in either place updates both.
 */

export type OnlineDay = "today" | "tomorrow";

export interface PrepItem {
  id: string;
  productId: string;
  /** Units online orders need, and in how many orders */
  needs: number;
  inOrders: number;
  onShelf: number;
  backroom: number;
  /** What to do — also the task added to "My store today" */
  task: NewTask;
  /** An existing task on today's list that does the same thing */
  linkedTask?: { kind: NewTask["kind"]; productId?: string; supplierId?: string };
  note?: { key: string; params?: Record<string, string | number> };
  /** Already done before the demo starts */
  doneAt?: string;
}

export interface AtRiskLine {
  productId: string;
  qty: number;
  /** The prep item that fixes this line, if any */
  fixedBy?: string;
}

export interface AtRiskOrder {
  id: string;
  items: number;
  lines: AtRiskLine[];
}

export interface Slot {
  id: string;
  from: string;
  to: string;
  pickingAt: string;
  orders: number;
  atRisk: AtRiskOrder[];
}

export interface OftenMissing {
  productId: string;
  /** Online orders it was missing from, last 4 weeks */
  orders: number;
  /** Online sales lost because it was missing, last 4 weeks, AMD */
  lost: number;
  reason: string;
  suggestion: { key: string; params?: Record<string, string | number> };
  /** Task to add for the suggestion; none = already handled elsewhere */
  task?: NewTask;
  handled?: "orderSuggestions";
}

export interface OnlineDayData {
  orders: number;
  vsLastWeek: number;
  pickingStarts: string;
  prep: PrepItem[];
  slots: Slot[];
}

export type MissReason = "shelfEmpty" | "lateDelivery" | "outOfStock" | "damaged";

export interface StoreOnline {
  days: Record<OnlineDay, OnlineDayData>;
  /** Items missing from online orders this week, and change vs. last week (%) */
  missingWeek: { items: number; lost: number; lostDelta: number };
  /** Yesterday's delivered online orders and how many had missing items (facts, not estimates) */
  yesterday: { orders: number; incomplete: number };
  often: OftenMissing[];
  /** Why items went missing, last 4 weeks: share of lost online sales */
  reasons: { key: MissReason; lost: number }[];
  /** Weekly % of online orders with missing items, oldest first; first `before` weeks are before the product */
  trend: { values: number[]; before: number };
}

const S03_TODAY: OnlineDayData = {
  orders: 38,
  vsLastWeek: 5,
  pickingStarts: "12:00",
  prep: [
    {
      id: "eggs", productId: "eggs10", needs: 14, inOrders: 9, onShelf: 9, backroom: 40,
      task: { kind: "moveToShelf", productId: "eggs10", params: { qty: 30, onShelf: 9, backroom: 40 }, tag: "online" },
      linkedTask: { kind: "refillOnline", productId: "eggs10" },
      note: { key: "inStoreToo", params: { count: 26 } },
    },
    {
      id: "cola", productId: "cola15", needs: 9, inOrders: 4, onShelf: 6, backroom: 0,
      task: { kind: "setAside", productId: "cola15", params: { qty: 6, orders: 4 }, tag: "online" },
      note: { key: "substitute", params: { qty: 3 } },
    },
    {
      id: "sour", productId: "sourcream", needs: 4, inOrders: 3, onShelf: 7, backroom: 12,
      task: { kind: "moveToShelf", productId: "sourcream", params: { qty: 10, onShelf: 7, backroom: 12 }, tag: "online" },
    },
    {
      id: "bread", productId: "bread600", needs: 7, inOrders: 5, onShelf: 14, backroom: 0,
      task: { kind: "setAside", productId: "bread600", params: { qty: 7, orders: 5 }, tag: "online" },
      note: { key: "nextDelivery", params: { time: "18:00" } },
      doneAt: "10:20",
    },
  ],
  slots: [
    { id: "t1", from: "12:00", to: "14:00", pickingAt: "10:30", orders: 8, atRisk: [] },
    {
      id: "t2", from: "14:00", to: "16:00", pickingAt: "12:30", orders: 12,
      atRisk: [
        { id: "4821", items: 14, lines: [{ productId: "eggs10", qty: 2, fixedBy: "eggs" }] },
        { id: "4826", items: 9, lines: [{ productId: "eggs10", qty: 1, fixedBy: "eggs" }, { productId: "sourcream", qty: 1, fixedBy: "sour" }] },
        { id: "4830", items: 11, lines: [{ productId: "cola15", qty: 3, fixedBy: "cola" }] },
      ],
    },
    {
      id: "t3", from: "16:00", to: "18:00", pickingAt: "14:30", orders: 10,
      atRisk: [
        { id: "4834", items: 7, lines: [{ productId: "eggs10", qty: 1, fixedBy: "eggs" }] },
        { id: "4839", items: 12, lines: [{ productId: "cola15", qty: 2, fixedBy: "cola" }] },
      ],
    },
    {
      id: "t4", from: "18:00", to: "20:00", pickingAt: "16:30", orders: 8,
      atRisk: [{ id: "4845", items: 6, lines: [{ productId: "sourcream", qty: 1, fixedBy: "sour" }] }],
    },
  ],
};

const S03_TOMORROW: OnlineDayData = {
  orders: 31,
  vsLastWeek: 2,
  pickingStarts: "12:00",
  prep: [
    {
      id: "eggs-tmr", productId: "eggs10", needs: 10, inOrders: 7, onShelf: 0, backroom: 0,
      task: { kind: "askStore", productId: "eggs10", params: { store: "s04", qty: 40, days: 3 } },
      note: { key: "agriLate", params: { supplier: "agrieggs" } },
    },
    {
      id: "cola-tmr", productId: "cola15", needs: 8, inOrders: 4, onShelf: 0, backroom: 0,
      task: { kind: "askSupplier", supplierId: "bevco", params: { time: "10:00" }, tag: "supplier" },
      note: { key: "afterDelivery", params: { time: "09:00", supplier: "bevco" } },
    },
  ],
  slots: [
    { id: "w1", from: "12:00", to: "14:00", pickingAt: "10:30", orders: 7, atRisk: [{ id: "4852", items: 10, lines: [{ productId: "eggs10", qty: 1, fixedBy: "eggs-tmr" }] }] },
    { id: "w2", from: "14:00", to: "16:00", pickingAt: "12:30", orders: 9, atRisk: [{ id: "4858", items: 8, lines: [{ productId: "cola15", qty: 2, fixedBy: "cola-tmr" }] }] },
    { id: "w3", from: "16:00", to: "18:00", pickingAt: "14:30", orders: 8, atRisk: [] },
    { id: "w4", from: "18:00", to: "20:00", pickingAt: "16:30", orders: 7, atRisk: [] },
  ],
};

const S03: StoreOnline = {
  days: { today: S03_TODAY, tomorrow: S03_TOMORROW },
  missingWeek: { items: 23, lost: 27_400, lostDelta: -31 },
  yesterday: { orders: 41, incomplete: 3 },
  reasons: [
    { key: "shelfEmpty", lost: 65_000 },
    { key: "lateDelivery", lost: 24_600 },
    { key: "outOfStock", lost: 15_700 },
    { key: "damaged", lost: 6_700 },
  ],
  // Last week = 100 − 94.1% delivered complete; the week before matches the −1.6 pp change on My store today
  trend: { values: [9.4, 8.8, 9.1, 9.0, 8.5, 8.0, 7.6, 7.1, 6.9, 7.3, 7.5, 5.9], before: 4 },
  often: [
    { productId: "eggs10", orders: 31, lost: 58_900, reason: "shelfEmpty", suggestion: { key: "weekendAside", params: { qty: 20 } }, task: { kind: "weekendAside", productId: "eggs10", params: { qty: 20 }, tag: "online" } },
    { productId: "cola15", orders: 18, lost: 23_400, reason: "lateDelivery", suggestion: { key: "earlierDelivery", params: { time: "10:00", supplier: "bevco" } }, task: { kind: "askSupplier", supplierId: "bevco", params: { time: "10:00" }, tag: "supplier" } },
    { productId: "sourcream", orders: 12, lost: 10_800, reason: "soldOutSunday", suggestion: { key: "orderMoreWeekend", params: { qty: 15 } }, handled: "orderSuggestions" },
    { productId: "bread600", orders: 9, lost: 4_700, reason: "eveningDelivery", suggestion: { key: "morningAside" }, task: { kind: "setAside", productId: "bread600", params: { qty: 7, orders: 5 }, tag: "online" } },
  ],
};

function derive(storeId: string): StoreOnline {
  const n = Number(storeId.slice(1));
  const scale = 0.75 + ((n * 37) % 50) / 100;
  const sc = (v: number) => Math.max(1, Math.round(v * scale));
  const helper = storeId === "s04" ? "s03" : "s04";
  const scaleDay = (day: OnlineDayData): OnlineDayData => ({
    ...day,
    orders: sc(day.orders),
    prep: day.prep.map((p) => ({
      ...p,
      needs: sc(p.needs),
      onShelf: p.onShelf ? sc(p.onShelf) : 0,
      backroom: p.backroom ? sc(p.backroom) : 0,
      task: "store" in p.task.params ? { ...p.task, params: { ...p.task.params, store: helper } } : p.task,
    })),
    slots: day.slots.map((s) => ({ ...s, orders: Math.max(s.atRisk.length + 2, sc(s.orders)) })),
  });
  return {
    ...S03,
    days: { today: { ...scaleDay(S03.days.today), orders: getStoreDay(storeId).online.orders }, tomorrow: scaleDay(S03.days.tomorrow) },
    missingWeek: { items: sc(23), lost: Math.round((27_400 * scale) / 100) * 100, lostDelta: -Math.round(15 + ((n * 7) % 25)) },
    yesterday: { orders: sc(41), incomplete: Math.max(1, Math.round(3 * scale)) },
    often: S03.often.map((o) => ({ ...o, orders: sc(o.orders), lost: Math.round((o.lost * scale) / 100) * 100 })),
    reasons: S03.reasons.map((r) => ({ ...r, lost: Math.round((r.lost * scale) / 100) * 100 })),
    trend: deriveTrend(storeId),
  };
}

/** S03's trend shape moved so it ends at this store's missing-items rate and matches its weekly change. */
function deriveTrend(storeId: string): StoreOnline["trend"] {
  const k = getStoreDay(storeId).kpis.week.onlineComplete;
  const last = Math.round((100 - k.value) * 10) / 10;
  const v = S03.trend.values;
  const shift = last - v[v.length - 1];
  const values = v.map((x) => Math.round((x + shift) * 10) / 10);
  values[values.length - 1] = last;
  values[values.length - 2] = Math.round((last + k.delta) * 10) / 10;
  return { values, before: trendWeeksBefore(getStore(storeId).goLive) };
}

const cache = new Map<string, StoreOnline>();
export function getOnline(storeId: string): StoreOnline {
  if (!cache.has(storeId)) cache.set(storeId, storeId === "s03" ? S03 : derive(storeId));
  return cache.get(storeId)!;
}
