import { getStoreDay, type TaskKind, type TaskParam, type TaskTag } from "./today";
import { getStore } from "./world";

/**
 * Stockout risk per store — docs/design-references/approved/07–08.
 * Store 03 is hand-crafted; other stores reuse it with scaled numbers.
 */

export type Horizon = "3d" | "7d";
export type RiskGroup = "today" | "tomorrow" | "soon" | "later";

/** A task that a screen can add to "My store today" (id is deterministic, so it's never added twice). */
export interface NewTask {
  kind: TaskKind;
  productId?: string;
  supplierId?: string;
  params: Record<string, TaskParam>;
  tag?: TaskTag;
}

export type StockStep =
  /** Points to a task that is already on today's list (falls back to adding `fallback`) */
  | { kind: "existing"; taskKind: TaskKind; productId: string; fallback: NewTask }
  /** Log a call with a supplier (completes the matching "call supplier" task if there is one) */
  | { kind: "call"; supplierId: string; params: Record<string, TaskParam> }
  /** A new task to add */
  | { kind: "add"; task: NewTask }
  /** Already covered by an upcoming supplier order */
  | { kind: "order"; supplierId: string };

export interface StockRow {
  productId: string;
  group: RiskGroup;
  /** "11:00" for today, otherwise a part of a day */
  runsOut: { time: string } | { day: Date; part: "morning" | "afternoon" | "evening" };
  tone: "bad" | "warn" | "neutral";
  onShelf: number;
  backroom: number;
  expectedToday: number;
  expected3: number;
  expected7: number;
  /** Short text in the table */
  action: { key: string; params?: Record<string, TaskParam> };
  actionMeta?: { key: string; params?: Record<string, TaskParam> };
  /** Next delivery, used for the stock chart; `uncertain` = supplier is late */
  delivery?: { inDays: number; qty: number; supplierId: string; uncertain?: boolean; due?: Date };
  steps: StockStep[];
}

export interface Miss {
  productId: string;
  what: { key: string; params?: Record<string, TaskParam> };
  lost: number;
}

export interface StoreStockouts {
  rows: StockRow[];
  forecastAccuracy: { value: number; delta: number };
  atRiskDelta: number;
  oosDeltaPp: number;
  misses: Miss[];
  missesTotal: number;
  /** Weekly out-of-stock rate, oldest first; the first `before` weeks are before the product */
  trend: { weeks: Date[]; values: number[]; before: number };
}

const d = (day: number) => new Date(2026, 10, day);
const wed = d(11);

const S03_ROWS: StockRow[] = [
  {
    productId: "eggs10", group: "today", runsOut: { time: "11:00" }, tone: "bad",
    onShelf: 9, backroom: 40, expectedToday: 26, expected3: 78, expected7: 182,
    action: { key: "refill" }, actionMeta: { key: "taskAdded" },
    delivery: { inDays: 1, qty: 240, supplierId: "agrieggs", uncertain: true, due: d(9) },
    steps: [
      { kind: "existing", taskKind: "refillOnline", productId: "eggs10", fallback: { kind: "moveToShelf", productId: "eggs10", params: { qty: 30, onShelf: 9, backroom: 40 }, tag: "online" } },
      { kind: "call", supplierId: "agrieggs", params: { due: d(9), qty: 240 } },
      { kind: "add", task: { kind: "askStore", productId: "eggs10", params: { store: "s04", qty: 40, days: 3 } } },
    ],
  },
  {
    productId: "cola15", group: "today", runsOut: { time: "12:00" }, tone: "bad",
    onShelf: 6, backroom: 0, expectedToday: 22, expected3: 66, expected7: 154,
    action: { key: "askStore", params: { store: "s04", qty: 24 } }, actionMeta: { key: "deliversTomorrow", params: { supplier: "bevco", time: "09:00" } },
    delivery: { inDays: 1, qty: 64, supplierId: "bevco" },
    steps: [
      { kind: "add", task: { kind: "askStore", productId: "cola15", params: { store: "s04", qty: 24, days: 2 } } },
      { kind: "add", task: { kind: "setAside", productId: "cola15", params: { qty: 6, orders: 4 }, tag: "online" } },
    ],
  },
  {
    productId: "sourcream", group: "today", runsOut: { time: "15:00" }, tone: "warn",
    onShelf: 7, backroom: 12, expectedToday: 15, expected3: 47, expected7: 110,
    action: { key: "refill" },
    delivery: { inDays: 2, qty: 60, supplierId: "dairyco" },
    steps: [{ kind: "add", task: { kind: "moveToShelf", productId: "sourcream", params: { qty: 10, onShelf: 7, backroom: 12 } } }],
  },
  {
    productId: "bread600", group: "today", runsOut: { time: "17:00" }, tone: "warn",
    onShelf: 14, backroom: 0, expectedToday: 58, expected3: 170, expected7: 400,
    action: { key: "askEarlier", params: { supplier: "freshbake" } }, actionMeta: { key: "eveningDelivery", params: { time: "18:00" } },
    delivery: { inDays: 0, qty: 100, supplierId: "freshbake" },
    steps: [{ kind: "add", task: { kind: "askSupplier", supplierId: "freshbake", params: { time: "15:00" }, tag: "supplier" } }],
  },
  {
    productId: "matsun", group: "tomorrow", runsOut: { day: wed, part: "morning" }, tone: "warn",
    onShelf: 30, backroom: 0, expectedToday: 21, expected3: 64, expected7: 150,
    action: { key: "covered", params: { supplier: "dairyco", day: d(12) } }, actionMeta: { key: "dayLow" },
    delivery: { inDays: 2, qty: 60, supplierId: "dairyco" },
    steps: [{ kind: "order", supplierId: "dairyco" }],
  },
  {
    productId: "cottage", group: "tomorrow", runsOut: { day: wed, part: "afternoon" }, tone: "warn",
    onShelf: 18, backroom: 0, expectedToday: 11, expected3: 33, expected7: 77,
    action: { key: "covered", params: { supplier: "dairyco", day: d(12) } },
    delivery: { inDays: 2, qty: 40, supplierId: "dairyco" },
    steps: [{ kind: "order", supplierId: "dairyco" }],
  },
  {
    productId: "milk25", group: "tomorrow", runsOut: { day: wed, part: "evening" }, tone: "neutral",
    onShelf: 46, backroom: 34, expectedToday: 48, expected3: 142, expected7: 330,
    action: { key: "covered", params: { supplier: "dairyco", day: d(12) } },
    delivery: { inDays: 2, qty: 120, supplierId: "dairyco" },
    steps: [{ kind: "order", supplierId: "dairyco" }],
  },
  {
    productId: "lavash", group: "tomorrow", runsOut: { day: wed, part: "evening" }, tone: "neutral",
    onShelf: 20, backroom: 0, expectedToday: 35, expected3: 105, expected7: 245,
    action: { key: "coveredTonight", params: { supplier: "freshbake" } },
    delivery: { inDays: 1, qty: 60, supplierId: "freshbake" },
    steps: [{ kind: "order", supplierId: "freshbake" }],
  },
  {
    productId: "butter", group: "soon", runsOut: { day: d(12), part: "afternoon" }, tone: "neutral",
    onShelf: 20, backroom: 14, expectedToday: 12, expected3: 36, expected7: 84,
    action: { key: "covered", params: { supplier: "dairyco", day: d(12) } },
    delivery: { inDays: 2, qty: 24, supplierId: "dairyco" },
    steps: [{ kind: "order", supplierId: "dairyco" }],
  },
  {
    productId: "lemonade", group: "soon", runsOut: { day: d(13), part: "morning" }, tone: "neutral",
    onShelf: 12, backroom: 0, expectedToday: 9, expected3: 27, expected7: 63,
    action: { key: "covered", params: { supplier: "bevco", day: d(12) } },
    delivery: { inDays: 2, qty: 31, supplierId: "bevco" },
    steps: [{ kind: "order", supplierId: "bevco" }],
  },
  {
    productId: "croissant", group: "soon", runsOut: { day: d(12), part: "morning" }, tone: "neutral",
    onShelf: 10, backroom: 0, expectedToday: 18, expected3: 54, expected7: 126,
    action: { key: "coveredTonight", params: { supplier: "freshbake" } },
    delivery: { inDays: 1, qty: 32, supplierId: "freshbake" },
    steps: [{ kind: "order", supplierId: "freshbake" }],
  },
  {
    productId: "kefir", group: "later", runsOut: { day: d(13), part: "afternoon" }, tone: "neutral",
    onShelf: 45, backroom: 0, expectedToday: 24, expected3: 72, expected7: 168,
    action: { key: "covered", params: { supplier: "dairyco", day: d(12) } },
    delivery: { inDays: 2, qty: 50, supplierId: "dairyco" },
    steps: [{ kind: "order", supplierId: "dairyco" }],
  },
  {
    productId: "water15", group: "later", runsOut: { day: d(14), part: "morning" }, tone: "neutral",
    onShelf: 60, backroom: 0, expectedToday: 38, expected3: 114, expected7: 266,
    action: { key: "covered", params: { supplier: "bevco", day: d(12) } },
    delivery: { inDays: 2, qty: 120, supplierId: "bevco" },
    steps: [{ kind: "order", supplierId: "bevco" }],
  },
  {
    productId: "cheese", group: "later", runsOut: { day: d(14), part: "afternoon" }, tone: "neutral",
    onShelf: 22, backroom: 0, expectedToday: 8, expected3: 24, expected7: 56,
    action: { key: "covered", params: { supplier: "dairyco", day: d(12) } },
    delivery: { inDays: 2, qty: 12, supplierId: "dairyco" },
    steps: [{ kind: "order", supplierId: "dairyco" }],
  },
  {
    productId: "buns", group: "later", runsOut: { day: d(15), part: "morning" }, tone: "neutral",
    onShelf: 5, backroom: 0, expectedToday: 8, expected3: 24, expected7: 56,
    action: { key: "coveredTonight", params: { supplier: "freshbake" } },
    delivery: { inDays: 1, qty: 24, supplierId: "freshbake" },
    steps: [{ kind: "order", supplierId: "freshbake" }],
  },
];

const S03: StoreStockouts = {
  rows: S03_ROWS,
  forecastAccuracy: { value: 91.8, delta: 2.1 },
  atRiskDelta: -3,
  oosDeltaPp: -0.6,
  misses: [
    { productId: "eggs10", what: { key: "emptyHoursDays", params: { hours: 9, days: 2 } }, lost: 310_000 },
    { productId: "cola15", what: { key: "emptyHoursOn", params: { hours: 7, day: d(7) } }, lost: 140_000 },
    { productId: "sourcream", what: { key: "emptyHoursOn", params: { hours: 5, day: d(8) } }, lost: 95_000 },
    { productId: "matsun", what: { key: "ranOutTimes", params: { count: 2 } }, lost: 80_000 },
  ],
  missesTotal: 1_550_000,
  trend: {
    weeks: Array.from({ length: 12 }, (_, i) => new Date(2026, 7, 17 + i * 7)),
    values: [6.9, 6.6, 6.8, 6.7, 6.4, 6.1, 5.6, 5.2, 4.9, 5.1, 4.8, 4.2],
    before: 4,
  },
};

/** The nearby store you could ask for stock (Baghramyan Ave for Komitas Ave). */
export function helperStoreId(storeId: string): string {
  return storeId === "s04" ? "s03" : "s04";
}

function derive(storeId: string): StoreStockouts {
  const n = Number(storeId.slice(1));
  const scale = 0.75 + ((n * 37) % 50) / 100;
  const sc = (v: number) => Math.max(1, Math.round(v * scale));
  const helper = helperStoreId(storeId);
  const fixStore = (p: Record<string, TaskParam>) => ("store" in p ? { ...p, store: helper } : p);
  const oos = Math.round((100 - getStoreDay(storeId).kpis.week.availability.value) * 10) / 10;
  const last = S03.trend.values[S03.trend.values.length - 1];
  return {
    ...S03,
    rows: S03.rows.map((r) => ({
      ...r,
      onShelf: sc(r.onShelf),
      backroom: r.backroom ? sc(r.backroom) : 0,
      expectedToday: sc(r.expectedToday),
      expected3: sc(r.expected3),
      expected7: sc(r.expected7),
      action: { ...r.action, params: r.action.params && fixStore(r.action.params) },
      steps: r.steps.map((st) => (st.kind === "add" ? { ...st, task: { ...st.task, params: fixStore(st.task.params) } } : st)),
    })),
    forecastAccuracy: { value: Math.round((88 + ((n * 13) % 60) / 10) * 10) / 10, delta: Math.round((((n * 7) % 30) / 10) * 10) / 10 },
    misses: S03.misses.map((m) => ({ ...m, lost: Math.round((m.lost * scale) / 5000) * 5000 })),
    missesTotal: Math.round((S03.missesTotal * scale) / 10000) * 10000,
    trend: { ...S03.trend, values: S03.trend.values.map((v) => Math.round((v - last + oos) * 10) / 10) },
  };
}

const cache = new Map<string, StoreStockouts>();
export function getStockouts(storeId: string): StoreStockouts {
  getStore(storeId);
  if (!cache.has(storeId)) cache.set(storeId, storeId === "s03" ? S03 : derive(storeId));
  return cache.get(storeId)!;
}

/** Deterministic id so the same suggested task is only ever added once. */
export function newTaskId(storeId: string, t: NewTask): string {
  return `${storeId}-x-${t.kind}-${t.productId ?? t.supplierId ?? "gen"}`;
}
