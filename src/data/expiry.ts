import { getProduct } from "./products";
import { helperStoreId, type StockStep } from "./stockouts";
import type { TaskParam } from "./today";

/**
 * Expiry & write-offs per store — docs/design-references/approved/13–14.
 * Store 03 is hand-crafted; other stores reuse it with scaled numbers.
 */

export type ExpiryGroup = "today" | "tomorrow" | "in2" | "in3" | "later";

export interface ExpiryRow {
  productId: string;
  group: ExpiryGroup;
  expires: Date;
  /** Time of day it expires, if today */
  time?: string;
  tone: "bad" | "warn" | "neutral";
  expiring: number;
  /** Units that will probably sell before expiry at the normal price */
  willSell: number;
  /** Already handled before the demo started */
  handled?: { key: "removed"; at: string };
  action: { key: string; params?: Record<string, TaskParam> };
  /** Daily sales until expiry: at normal price, and with the suggested markdown */
  daily?: { normal: number[]; markdown?: number[]; cut?: number };
  steps: StockStep[];
}

export interface StoreExpiry {
  rows: ExpiryRow[];
  rate: { value: number; delta: number };
  savedByMarkdowns: number;
  /** Write-offs by reason, last 4 weeks, AMD */
  reasons: { key: "expired" | "damaged" | "spoiled" | "other"; value: number }[];
  topExpired: string[];
  /** Weekly write-offs in AMD, oldest first; first `before` weeks are before the product */
  trend: { values: number[]; before: number };
}

const d = (day: number) => new Date(2026, 10, day);

const S03_ROWS: ExpiryRow[] = [
  {
    productId: "kefir", group: "today", expires: d(10), tone: "neutral", expiring: 12, willSell: 0,
    handled: { key: "removed", at: "08:55" }, action: { key: "removed" }, steps: [],
  },
  {
    productId: "croissant", group: "today", expires: d(10), time: "20:00", tone: "bad", expiring: 14, willSell: 6,
    action: { key: "markdownAfter", params: { cut: 50, time: "17:00" } },
    daily: { normal: [6], markdown: [13], cut: 50 },
    steps: [{ kind: "add", task: { kind: "markdown", productId: "croissant", params: { units: 14, date: d(10), cut: 50 }, tag: "expiry" } }],
  },
  {
    productId: "lavash", group: "tomorrow", expires: d(11), tone: "warn", expiring: 18, willSell: 12,
    action: { key: "frontOfShelf" }, daily: { normal: [7, 5] },
    steps: [{ kind: "add", task: { kind: "frontOfShelf", productId: "lavash", params: { units: 18 } } }],
  },
  {
    productId: "cream10", group: "tomorrow", expires: d(11), tone: "warn", expiring: 8, willSell: 3,
    action: { key: "markdown", params: { cut: 25 } }, daily: { normal: [2, 1], markdown: [4, 4], cut: 25 },
    steps: [{ kind: "add", task: { kind: "markdown", productId: "cream10", params: { units: 8, date: d(11), cut: 25 }, tag: "expiry" } }],
  },
  {
    productId: "yogurt", group: "in2", expires: d(12), tone: "warn", expiring: 46, willSell: 20,
    action: { key: "markdown", params: { cut: 30 } }, daily: { normal: [10, 10], markdown: [20, 24], cut: 30 },
    steps: [
      { kind: "existing", taskKind: "markdown", productId: "yogurt", fallback: { kind: "markdown", productId: "yogurt", params: { units: 46, date: d(12), cut: 30 }, tag: "expiry" } },
      { kind: "add", task: { kind: "sendToStore", productId: "yogurt", params: { store: "s04", qty: 10, perDay: 20 } } },
      { kind: "orderLess", supplierId: "dairyco", qty: 0 },
    ],
  },
  {
    productId: "lori", group: "in2", expires: d(12), tone: "neutral", expiring: 5, willSell: 3,
    action: { key: "frontOfShelf" }, daily: { normal: [1, 1, 1] },
    steps: [{ kind: "add", task: { kind: "frontOfShelf", productId: "lori", params: { units: 5 } } }],
  },
  {
    productId: "buns", group: "in3", expires: d(13), tone: "neutral", expiring: 6, willSell: 4,
    action: { key: "frontOfShelf" }, daily: { normal: [1, 1, 1, 1] },
    steps: [{ kind: "add", task: { kind: "frontOfShelf", productId: "buns", params: { units: 6 } } }],
  },
  {
    productId: "tan", group: "in3", expires: d(13), tone: "neutral", expiring: 10, willSell: 7,
    action: { key: "markdown", params: { cut: 20 } }, daily: { normal: [2, 2, 2, 1], markdown: [3, 3, 3, 1], cut: 20 },
    steps: [{ kind: "add", task: { kind: "markdown", productId: "tan", params: { units: 10, date: d(13), cut: 20 }, tag: "expiry" } }],
  },
  {
    productId: "chanakh", group: "later", expires: d(15), tone: "neutral", expiring: 6, willSell: 5,
    action: { key: "frontOfShelf" },
    steps: [{ kind: "add", task: { kind: "frontOfShelf", productId: "chanakh", params: { units: 6 } } }],
  },
  {
    productId: "milk15", group: "later", expires: d(16), tone: "neutral", expiring: 12, willSell: 10,
    action: { key: "frontOfShelf" },
    steps: [{ kind: "add", task: { kind: "frontOfShelf", productId: "milk15", params: { units: 12 } } }],
  },
];

const S03: StoreExpiry = {
  rows: S03_ROWS,
  rate: { value: 2.9, delta: -0.3 },
  savedByMarkdowns: 240_000,
  reasons: [
    { key: "expired", value: 1_380_000 },
    { key: "damaged", value: 520_000 },
    { key: "spoiled", value: 330_000 },
    { key: "other", value: 150_000 },
  ],
  topExpired: ["kefir", "yogurt", "croissant"],
  trend: { values: [0.79, 0.76, 0.81, 0.77, 0.74, 0.71, 0.68, 0.66, 0.63, 0.6, 0.585, 0.61].map((m) => m * 1e6), before: 4 },
};

export const atRiskUnits = (r: ExpiryRow) => Math.max(0, r.expiring - r.willSell);
export const atRiskValue = (r: ExpiryRow) => atRiskUnits(r) * getProduct(r.productId).price;
export const stockValue = (r: ExpiryRow) => r.expiring * getProduct(r.productId).price;

function derive(storeId: string): StoreExpiry {
  const n = Number(storeId.slice(1));
  const scale = 0.75 + ((n * 37) % 50) / 100;
  const sc = (v: number) => Math.max(1, Math.round(v * scale));
  const helper = helperStoreId(storeId);
  const fix = (p: Record<string, TaskParam>) => ("store" in p ? { ...p, store: helper } : p);
  return {
    ...S03,
    rows: S03.rows.map((r) => {
      const expiring = sc(r.expiring);
      return {
        ...r,
        expiring,
        willSell: Math.min(expiring, sc(r.willSell)),
        steps: r.steps.map((s) => (s.kind === "add" ? { ...s, task: { ...s.task, params: fix(s.task.params) } } : s)),
      };
    }),
    savedByMarkdowns: Math.round((S03.savedByMarkdowns * scale) / 10000) * 10000,
    reasons: S03.reasons.map((x) => ({ ...x, value: Math.round((x.value * scale) / 10000) * 10000 })),
    trend: { ...S03.trend, values: S03.trend.values.map((v) => Math.round(v * scale)) },
  };
}

const cache = new Map<string, StoreExpiry>();
export function getExpiry(storeId: string): StoreExpiry {
  if (!cache.has(storeId)) cache.set(storeId, storeId === "s03" ? S03 : derive(storeId));
  return cache.get(storeId)!;
}
