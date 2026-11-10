import type { StockStep } from "./stockouts";

/**
 * Promotions per store — docs/design-references/approved/17–18.
 * Promotions are set by head office; the store prepares for them.
 */

export interface UpcomingPromo {
  id: string;
  name: { key: string; params?: Record<string, string | number> };
  from: Date;
  to?: Date;
  /** e.g. "19:00–21:00" for daily promotions */
  hours?: string;
  productIds: string[];
  productCount: number;
  extraSales: number;
  /** Expected uplift on promoted products, % */
  upliftPct: number;
  /** Headline product for the chart */
  focus?: { productId: string; normal: number[]; promo: number[]; extraUnits: number; unit: "l" | "pcs" };
  steps: StockStep[];
  /** Shown when there is nothing to do */
  note?: { key: string; params?: Record<string, string | number> };
}

export interface RunningPromo {
  name: { key: string; params?: Record<string, string | number> };
  until: Date;
  upliftPct: number;
  note?: { key: string; tone: "warn" | "good" };
}

export interface PastPromo {
  name: { key: string; params?: Record<string, string | number> };
  from: Date;
  to: Date;
  extraSales: number;
  discountCost: number;
  leftover?: boolean;
}

export interface StorePromotions {
  upcoming: UpcomingPromo[];
  running: RunningPromo[];
  past: PastPromo[];
  extraSalesWeek: number;
  extraSalesPct: number;
  paidOff: { count: number; total: number };
}

const d = (m: number, day: number) => new Date(2026, m, day);

const S03: StorePromotions = {
  upcoming: [
    {
      id: "weekend-dairy",
      name: { key: "weekendDairy", params: { cut: 15 } },
      from: d(10, 13), to: d(10, 15),
      productIds: ["milk32", "kefir", "yogurt"], productCount: 18,
      extraSales: 420_000, upliftPct: 35,
      focus: { productId: "milk32", normal: [140, 170, 150], promo: [185, 230, 205], extraUnits: 160, unit: "l" },
      steps: [
        { kind: "orderExtra", supplierId: "dairyco", productId: "milk32", qty: 160 },
        { kind: "existing", taskKind: "promoTags", fallback: { kind: "promoTags", params: { count: 18, starts: d(10, 13) }, tag: "promo" } },
        { kind: "add", task: { kind: "clearSpace", params: { area: "dairyFridge" }, tag: "promo" } },
        { kind: "note", key: "yogurtOverstocked", params: { units: 46 } },
      ],
    },
    {
      id: "bakery-hour",
      name: { key: "bakeryHour", params: { cut: 30 } },
      from: d(10, 16), hours: "19:00–21:00",
      productIds: ["bread600", "croissant", "buns"], productCount: 6,
      extraSales: 120_000, upliftPct: 22,
      steps: [],
      note: { key: "cutsWriteOffs" },
    },
    {
      id: "black-friday",
      name: { key: "blackFriday" },
      from: d(10, 27), to: d(10, 29),
      productIds: ["cola15", "pasta", "coffee"], productCount: 34,
      extraSales: 1_100_000, upliftPct: 45,
      steps: [],
      note: { key: "remindLater" },
    },
  ],
  running: [
    { name: { key: "matsun2for1" }, until: d(10, 11), upliftPct: 40, note: { key: "runningLow", tone: "warn" } },
    { name: { key: "coffeeCut", params: { cut: 20 } }, until: d(10, 15), upliftPct: 25, note: { key: "clearingExtra", tone: "good" } },
    { name: { key: "breadCut", params: { cut: 10 } }, until: d(10, 13), upliftPct: 12 },
  ],
  past: [
    { name: { key: "cola3for2" }, from: d(9, 16), to: d(9, 18), extraSales: 210_000, discountCost: 70_000 },
    { name: { key: "iceCreamCut", params: { cut: 20 } }, from: d(7, 21), to: d(7, 27), extraSales: 180_000, discountCost: 65_000 },
    { name: { key: "oliveCut", params: { cut: 10 } }, from: d(9, 2), to: d(9, 8), extraSales: 40_000, discountCost: 55_000 },
    { name: { key: "yogurtCut", params: { cut: 15 } }, from: d(8, 25), to: d(8, 27), extraSales: 60_000, discountCost: 30_000, leftover: true },
  ],
  extraSalesWeek: 860_000,
  extraSalesPct: 18,
  paidOff: { count: 7, total: 10 },
};

const cache = new Map<string, StorePromotions>();
export function getPromotions(storeId: string): StorePromotions {
  if (!cache.has(storeId)) {
    if (storeId === "s03") cache.set(storeId, S03);
    else {
      const n = Number(storeId.slice(1));
      const scale = 0.75 + ((n * 37) % 50) / 100;
      const m = (v: number) => Math.round((v * scale) / 5000) * 5000;
      cache.set(storeId, {
        ...S03,
        upcoming: S03.upcoming.map((u) => ({ ...u, extraSales: m(u.extraSales) })),
        past: S03.past.map((p) => ({ ...p, extraSales: m(p.extraSales), discountCost: m(p.discountCost) })),
        extraSalesWeek: m(S03.extraSalesWeek),
      });
    }
  }
  return cache.get(storeId)!;
}
