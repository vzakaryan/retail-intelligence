import { getProduct, type Product } from "./products";
import { helperStoreId, type StockStep } from "./stockouts";
import type { TaskParam } from "./today";

/**
 * Overstock per store — docs/design-references/approved/11–12.
 * Store 03 is hand-crafted; other stores reuse it with scaled numbers.
 */

export type ReasonKey = "seasonal" | "slowSeller" | "promoEnded" | "overOrderedExpiring" | "overOrdered";

export interface OverRow {
  productId: string;
  inStore: number;
  perDay: number;
  /** Target days of stock for this product at this store */
  target: number;
  extraUnits: number;
  action: { key: string; params?: Record<string, TaskParam> };
  actionMeta?: { key: string; params?: Record<string, TaskParam> };
  reason: { key: ReasonKey; params?: Record<string, TaskParam> };
  /** Weekly units sold and delivered, last 8 weeks (oldest first) */
  sold: number[];
  delivered: number[];
  /** Expires within 7 days (counts toward "expiring extra stock") */
  expiringSoon?: boolean;
  steps: StockStep[];
}

export interface StoreOverstock {
  rows: OverRow[];
  daysOfStock: { value: number; delta: number; target: number };
  extraDeltaPct: number;
  countDelta: number;
  categories: { key: Product["category"]; days: number; target: number }[];
  /** Weekly extra stock value in AMD, oldest first; first `before` weeks are before the product */
  trend: { values: number[]; before: number };
}

const d = (day: number) => new Date(2026, 10, day);
const flat = (v: number, n = 8) => Array(n).fill(v);

const S03_ROWS: OverRow[] = [
  {
    productId: "olive", inStore: 64, perDay: 2, target: 14, extraUnits: 36,
    action: { key: "promotion", params: { cut: 15 } }, actionMeta: { key: "endOfAisle" },
    reason: { key: "promoEnded" }, sold: [24, 26, 22, 14, 13, 14, 13, 14], delivered: flat(18),
    steps: [
      { kind: "add", task: { kind: "promotion", productId: "olive", params: { cut: 15, until: d(22) } } },
      { kind: "orderLess", supplierId: "groceryhub", qty: 0, usual: 12, next: d(13) },
    ],
  },
  {
    productId: "icecream", inStore: 84, perDay: 3, target: 10, extraUnits: 54,
    action: { key: "sendToStore", params: { store: "s01", qty: 30 } }, actionMeta: { key: "salesDropped", params: { pct: 40 } },
    reason: { key: "seasonal", params: { pct: 40 } }, sold: [38, 36, 34, 30, 24, 21, 20, 21], delivered: [40, 40, 36, 40, 40, 36, 40, 40],
    steps: [
      { kind: "add", task: { kind: "sendToStore", productId: "icecream", params: { store: "s01", qty: 30, perDay: 6 } } },
      { kind: "orderLess", supplierId: "coldfoods", qty: 0, usual: 48, next: d(16) },
      { kind: "add", task: { kind: "promotion", productId: "icecream", params: { cut: 20, until: d(22) } } },
    ],
  },
  {
    productId: "coffee", inStore: 48, perDay: 2, target: 12, extraUnits: 24,
    action: { key: "sendToStore", params: { store: "s04", qty: 20 } },
    reason: { key: "slowSeller" }, sold: [16, 15, 15, 14, 14, 13, 14, 14], delivered: flat(18),
    steps: [
      { kind: "add", task: { kind: "sendToStore", productId: "coffee", params: { store: "s04", qty: 20, perDay: 4 } } },
      { kind: "orderLess", supplierId: "groceryhub", qty: 0, usual: 12, next: d(13) },
    ],
  },
  {
    productId: "yogurt", inStore: 92, perDay: 10, target: 3, extraUnits: 60,
    action: { key: "markdown", params: { cut: 30 } }, actionMeta: { key: "expiresThu", params: { units: 46, day: d(12) } },
    reason: { key: "overOrderedExpiring", params: { units: 46, day: d(12) } }, sold: [70, 72, 68, 71, 66, 70, 69, 70], delivered: [72, 70, 70, 72, 70, 96, 96, 96],
    expiringSoon: true,
    steps: [
      { kind: "existing", taskKind: "markdown", productId: "yogurt", fallback: { kind: "markdown", productId: "yogurt", params: { units: 46, date: d(12), cut: 30 }, tag: "expiry" } },
      { kind: "add", task: { kind: "sendToStore", productId: "yogurt", params: { store: "s04", qty: 10, perDay: 20 } } },
      { kind: "orderLess", supplierId: "dairyco", qty: 0 },
    ],
  },
  {
    productId: "cornflakes", inStore: 40, perDay: 2, target: 10, extraUnits: 20,
    action: { key: "orderLess" }, actionMeta: { key: "suggested", params: { qty: 0, supplier: "groceryhub" } },
    reason: { key: "overOrdered" }, sold: flat(14), delivered: flat(20),
    steps: [{ kind: "orderLess", supplierId: "groceryhub", qty: 0, usual: 20, next: d(13) }],
  },
  {
    productId: "sparkling", inStore: 140, perDay: 8, target: 7, extraUnits: 86,
    action: { key: "orderLess" }, actionMeta: { key: "suggestedInstead", params: { qty: 56, usual: 120 } },
    reason: { key: "overOrdered" }, sold: [56, 58, 55, 57, 54, 56, 57, 56], delivered: flat(120),
    steps: [{ kind: "orderLess", supplierId: "bevco", qty: 56, usual: 120 }],
  },
  {
    productId: "pasta", inStore: 70, perDay: 3, target: 14, extraUnits: 28,
    action: { key: "promotion", params: { cut: 10 } },
    reason: { key: "slowSeller" }, sold: flat(21), delivered: flat(24),
    steps: [
      { kind: "add", task: { kind: "promotion", productId: "pasta", params: { cut: 10, until: d(22) } } },
      { kind: "orderLess", supplierId: "groceryhub", qty: 0, usual: 24, next: d(13) },
    ],
  },
  {
    productId: "energy", inStore: 25, perDay: 1, target: 14, extraUnits: 11,
    action: { key: "orderLess" }, actionMeta: { key: "suggestedInstead", params: { qty: 23, usual: 40 } },
    reason: { key: "overOrdered" }, sold: flat(7), delivered: flat(10),
    steps: [{ kind: "orderLess", supplierId: "bevco", qty: 23, usual: 40 }],
  },
  {
    productId: "ajuice", inStore: 20, perDay: 1, target: 10, extraUnits: 10,
    action: { key: "frontOfShelf" },
    reason: { key: "slowSeller" }, sold: flat(8), delivered: flat(10),
    steps: [{ kind: "add", task: { kind: "frontOfShelf", productId: "ajuice", params: { units: 20 } } }],
  },
  {
    productId: "icetea", inStore: 15, perDay: 1, target: 10, extraUnits: 5,
    action: { key: "frontOfShelf" },
    reason: { key: "seasonal", params: { pct: 25 } }, sold: [12, 11, 10, 9, 8, 7, 7, 7], delivered: flat(9),
    steps: [{ kind: "add", task: { kind: "frontOfShelf", productId: "icetea", params: { units: 15 } } }],
  },
];

const S03: StoreOverstock = {
  rows: S03_ROWS,
  daysOfStock: { value: 11.2, delta: -1.4, target: 9 },
  extraDeltaPct: -9,
  countDelta: -4,
  categories: [
    { key: "frozen", days: 21, target: 10 },
    { key: "dry", days: 16, target: 14 },
    { key: "beverages", days: 9.8, target: 7 },
    { key: "dairy", days: 4.1, target: 3 },
    { key: "bakery", days: 1.2, target: 1.5 },
  ],
  trend: { values: [0.62, 0.6, 0.63, 0.6, 0.57, 0.54, 0.52, 0.49, 0.47, 0.48, 0.45, 0.41].map((m) => m * 1e6), before: 4 },
};

/** Extra value of a row in AMD */
export const extraValue = (r: OverRow) => r.extraUnits * getProduct(r.productId).price;
export const daysOfStock = (r: OverRow) => Math.round(r.inStore / r.perDay);

function derive(storeId: string): StoreOverstock {
  const n = Number(storeId.slice(1));
  const scale = 0.75 + ((n * 37) % 50) / 100;
  const sc = (v: number) => Math.max(1, Math.round(v * scale));
  const helper = helperStoreId(storeId);
  const other = (id: TaskParam) => (id === storeId ? helper : id);
  const fix = (p?: Record<string, TaskParam>) => (p && "store" in p ? { ...p, store: other(p.store) } : p);
  return {
    ...S03,
    rows: S03.rows.map((r) => ({
      ...r,
      inStore: sc(r.inStore),
      extraUnits: sc(r.extraUnits),
      action: { ...r.action, params: fix(r.action.params) },
      steps: r.steps.map((s) => (s.kind === "add" ? { ...s, task: { ...s.task, params: fix(s.task.params)! } } : s)),
    })),
    daysOfStock: { ...S03.daysOfStock, value: Math.round(S03.daysOfStock.value * (0.85 + scale * 0.2) * 10) / 10 },
    trend: { ...S03.trend, values: S03.trend.values.map((v) => Math.round(v * scale)) },
  };
}

const cache = new Map<string, StoreOverstock>();
export function getOverstock(storeId: string): StoreOverstock {
  if (!cache.has(storeId)) cache.set(storeId, storeId === "s03" ? S03 : derive(storeId));
  return cache.get(storeId)!;
}
