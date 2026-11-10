import { getStore } from "./world";

/**
 * "My store today" data per store.
 * Store 03 (the demo persona's store) is hand-crafted to match
 * docs/design-references/approved/01-my-store-today.png. Other stores are
 * derived deterministically so every store in the selector looks plausible.
 */

export type Period = "week" | "4w";

export interface Kpi {
  value: number;
  /** pp for percentages, % change for money */
  delta: number;
}

export interface DayKpis {
  availability: Kpi;
  onlineComplete: Kpi & { done: number; total: number };
  lostSales: Kpi;
  writeOffs: Kpi;
}

export type TaskKind =
  | "refill"
  | "refillOnline"
  | "removeExpired"
  | "checkExpiry"
  | "reviewOrder"
  | "markdown"
  | "callSupplier"
  | "promoTags"
  // Added during the demo from Stockout risk / Online orders:
  | "askStore"
  | "askSupplier"
  | "moveToShelf"
  | "setAside"
  | "weekendAside"
  | "sendToStore"
  | "promotion"
  | "frontOfShelf"
  | "clearSpace";

export type TaskTag = "online" | "ordering" | "expiry" | "supplier" | "promo";
export type TaskAction = "markDone" | "review" | "logCall";
export type TaskParam = string | number | Date;

export interface Task {
  id: string;
  kind: TaskKind;
  productId?: string;
  supplierId?: string;
  params: Record<string, TaskParam>;
  tag?: TaskTag;
  action: TaskAction;
  /** Done before the demo starts; `at` is the time it was done. */
  doneAt?: string;
  /** Hidden behind "Show more" until expanded */
  extra?: boolean;
}

export interface OnlineItem {
  productId: string;
  inOrders: number;
  onShelf: number;
  level: "refill" | "low";
}

export type RiskAction =
  | { kind: "refill"; taskAdded: boolean }
  | { kind: "noneInBackroom"; supplierId: string }
  | { kind: "nextDelivery"; time: string };

export interface RiskRow {
  productId: string;
  onShelf: number;
  backroom: number;
  expectedToday: number;
  runsOutAt: string;
  severity: "bad" | "warn";
  action: RiskAction;
}

export interface StoreDay {
  kpis: Record<Period, DayKpis>;
  tasks: Task[];
  online: { orders: number; atRisk: number; items: OnlineItem[] };
  results: { availabilityPp: number; lostSalesPct: number; writeOffsPct: number; actedOnPct: number };
  atRisk: { total: number; rows: RiskRow[] };
}

const nov = (day: number) => new Date(2026, 10, day);

// ---------------------------------------------------------------- Store 03

const TASKS_S03: Omit<Task, "id">[] = [
  { kind: "refill", productId: "milk32", params: { moved: 60, aisle: 3 }, action: "markDone", doneAt: "08:40" },
  { kind: "removeExpired", productId: "kefir", params: { units: 12 }, action: "markDone", doneAt: "08:55" },
  { kind: "refillOnline", productId: "eggs10", params: { time: "11:00", onShelf: 9, backroom: 40, orders: 9 }, tag: "online", action: "markDone" },
  { kind: "reviewOrder", supplierId: "dairyco", params: { deadline: "16:00", count: 14, delivery: nov(12) }, tag: "ordering", action: "review" },
  { kind: "markdown", productId: "yogurt", params: { units: 46, date: nov(12), cut: 30 }, tag: "expiry", action: "markDone" },
  { kind: "callSupplier", supplierId: "agrieggs", params: { due: nov(9), days: 2 }, tag: "supplier", action: "logCall" },
  { kind: "checkExpiry", params: { found: 4 }, action: "markDone", doneAt: "07:30", extra: true },
  { kind: "promoTags", params: { count: 18, starts: nov(13) }, tag: "promo", action: "markDone", extra: true },
];

const S03: StoreDay = {
  kpis: {
    week: {
      availability: { value: 95.8, delta: 0.9 },
      onlineComplete: { value: 94.1, delta: 1.6, done: 112, total: 119 },
      lostSales: { value: 1_420_000, delta: -8.5 },
      writeOffs: { value: 610_000, delta: 4.2 },
    },
    "4w": {
      availability: { value: 95.8, delta: 1.1 },
      onlineComplete: { value: 94.1, delta: 1.2, done: 451, total: 479 },
      lostSales: { value: 5_600_000, delta: -12.4 },
      writeOffs: { value: 2_380_000, delta: -6.1 },
    },
  },
  tasks: TASKS_S03.map((t, i) => ({ ...t, id: `s03-t${i + 1}` })),
  online: {
    orders: 38,
    atRisk: 6,
    items: [
      { productId: "eggs10", inOrders: 9, onShelf: 9, level: "refill" },
      { productId: "cola15", inOrders: 4, onShelf: 6, level: "low" },
      { productId: "sourcream", inOrders: 3, onShelf: 7, level: "low" },
    ],
  },
  results: { availabilityPp: 2.4, lostSalesPct: -18, writeOffsPct: -11, actedOnPct: 86 },
  atRisk: {
    total: 11,
    rows: [
      { productId: "eggs10", onShelf: 9, backroom: 40, expectedToday: 26, runsOutAt: "11:00", severity: "bad", action: { kind: "refill", taskAdded: true } },
      { productId: "cola15", onShelf: 6, backroom: 0, expectedToday: 22, runsOutAt: "12:00", severity: "bad", action: { kind: "noneInBackroom", supplierId: "bevco" } },
      { productId: "sourcream", onShelf: 7, backroom: 12, expectedToday: 15, runsOutAt: "15:00", severity: "warn", action: { kind: "refill", taskAdded: false } },
      { productId: "bread600", onShelf: 14, backroom: 0, expectedToday: 58, runsOutAt: "17:00", severity: "warn", action: { kind: "nextDelivery", time: "18:00" } },
    ],
  },
};

// ------------------------------------------------- Other stores (derived)

/** Small deterministic PRNG so derived stores look the same on every load. */
function rng(seed: number) {
  let a = seed * 2654435761;
  return (min: number, max: number, digits = 1) => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    const f = 10 ** digits;
    return Math.round((min + r * (max - min)) * f) / f;
  };
}

const OPEN_TASK_POOL: Omit<Task, "id">[] = [
  TASKS_S03[2],
  TASKS_S03[3],
  TASKS_S03[4],
  TASKS_S03[5],
  { kind: "refill", productId: "sourcream", params: { onShelf: 6, backroom: 14, aisle: 3 }, action: "markDone" },
  { kind: "reviewOrder", supplierId: "freshbake", params: { deadline: "20:00", count: 6, delivery: nov(11) }, tag: "ordering", action: "review" },
  TASKS_S03[7],
  { kind: "markdown", productId: "kefir", params: { units: 18, date: nov(11), cut: 25 }, tag: "expiry", action: "markDone" },
  { kind: "refill", productId: "cola15", params: { onShelf: 8, backroom: 24, aisle: 7 }, action: "markDone" },
];

function deriveDay(storeId: string): StoreDay {
  const store = getStore(storeId);
  const r = rng(Number(storeId.slice(1)));
  const k = store.kpis;
  const total = Math.round(r(90, 140, 0));
  const weekLost = Math.round((k.lostSales4w / 4) * r(0.9, 1.1, 2));
  const weekWriteOffs = Math.round(r(400_000, 800_000, 0) / 10_000) * 10_000;

  const open = OPEN_TASK_POOL.slice(0, store.today.openTasks).map((t) => ({ ...t, extra: false }));
  const done = [TASKS_S03[0], TASKS_S03[1]];
  const tasks = [...done, ...open].map((t, i, all) => ({ ...t, id: `${storeId}-t${i + 1}`, extra: all.length > 6 && i >= 6 }));

  return {
    kpis: {
      week: {
        availability: { value: k.availability, delta: r(-0.6, 1.4) },
        onlineComplete: { value: k.onlineFulfillment, delta: r(-0.8, 2), done: Math.round((total * k.onlineFulfillment) / 100), total },
        lostSales: { value: weekLost, delta: r(-15, 8) },
        writeOffs: { value: weekWriteOffs, delta: r(-10, 8) },
      },
      "4w": {
        availability: { value: k.availability, delta: r(-0.5, 1.8) },
        onlineComplete: { value: k.onlineFulfillment, delta: r(-0.5, 2), done: Math.round((total * 4 * k.onlineFulfillment) / 100), total: total * 4 },
        lostSales: { value: k.lostSales4w, delta: r(-20, 5) },
        writeOffs: { value: weekWriteOffs * 4, delta: r(-12, 4) },
      },
    },
    tasks,
    online: {
      orders: Math.round(r(25, 45, 0)),
      atRisk: Math.round(r(3, 8, 0)),
      items: S03.online.items.map((it) => ({ ...it, inOrders: Math.round(r(2, 10, 0)), onShelf: Math.round(r(4, 12, 0)) })),
    },
    results: {
      availabilityPp: r(0.5, 3),
      lostSalesPct: Math.round(r(-22, -5, 0)),
      writeOffsPct: Math.round(r(-15, -3, 0)),
      actedOnPct: k.suggestionsActedOn,
    },
    atRisk: {
      total: Math.round(r(6, 15, 0)),
      rows: S03.atRisk.rows.map((row) => ({
        ...row,
        onShelf: Math.max(3, row.onShelf + Math.round(r(-3, 3, 0))),
        expectedToday: Math.max(10, row.expectedToday + Math.round(r(-5, 5, 0))),
      })),
    },
  };
}

const cache = new Map<string, StoreDay>();

export function getStoreDay(storeId: string): StoreDay {
  if (storeId === "s03") return S03;
  if (!cache.has(storeId)) cache.set(storeId, deriveDay(storeId));
  return cache.get(storeId)!;
}
