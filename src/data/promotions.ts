import type { NewTask, StockStep } from "./stockouts";

/**
 * Promotions per store (reworked in step 20).
 *
 * The client has no digital promotion setup, so nothing here is typed in:
 * - Suggested promotions are generated from other modules (extra stock, slow
 *   sellers, demand peaks). The store sends them to head office (or decides
 *   itself) and records the answer.
 * - Past promotions are found in the till data: a product sold below its
 *   regular price for some days. We measure the lift and whether it paid off.
 */

export type IdeaReason = "extraStock" | "slowSeller" | "demandPeak";

export interface PromoIdea {
  id: string;
  /** Headline product (a promotion may cover more, see `productCount`) */
  productId: string;
  productCount?: number;
  reason: { key: IdeaReason; detail: string; params?: Record<string, string | number> };
  /** Discount, % */
  cut: number;
  from: Date;
  to: Date;
  /** Expected units of the headline product over the promotion: at the normal price vs. with the discount */
  normalUnits: number;
  promoUnits: number;
  /** Extra stock value it would sell off, AMD (0 for demand peaks) */
  clears: number;
  /** Expected extra sales and the cost of the discount, AMD */
  extraSales: number;
  discountCost: number;
  /** Daily units of the headline product for the panel chart */
  daily: { normal: number[]; promo: number[] };
  /** What the store does once it's approved */
  steps: StockStep[];
  /** Approved before the demo starts (by head office), on this day */
  approvedOn?: Date;
}

export interface PastPromo {
  id: string;
  productId: string;
  /** e.g. { key: "cut", params: { cut: 20 } } or { key: "threeForTwo" } */
  deal: { key: string; params?: Record<string, number> };
  from: Date;
  to: Date;
  /** Sales lift on the product while it was cheaper, % */
  liftPct: number;
  extraSales: number;
  discountCost: number;
  /** Daily units: a normal week's same days vs. during the promotion */
  daily: { normal: number[]; promo: number[] };
  /** Note shown in the panel (e.g. sales dipped afterwards) */
  note?: string;
}

export interface StorePromotions {
  ideas: PromoIdea[];
  past: PastPromo[];
  /** Extra sales this week from promotions running now (found in till data) */
  extraSalesWeek: number;
  extraSalesPct: number;
  runningNow: { productId: string; deal: { key: string; params?: Record<string, number> } }[];
}

const d = (m: number, day: number) => new Date(2026, m, day);
const promoTask = (productId: string, cut: number, until: Date): NewTask => ({ kind: "promotion", productId, params: { cut, until } });
/** Spread units over days with a little day-to-day variation */
const spread = (total: number, days: number, seed: number) => {
  const w = Array.from({ length: days }, (_, i) => 0.85 + (((seed + i * 7) % 9) / 9) * 0.3);
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => Math.max(0, Math.round((total * x) / sum)));
};

const IDEAS: PromoIdea[] = [
  {
    id: "olive",
    productId: "olive",
    reason: { key: "extraStock", detail: "lastTimeTooSmall", params: { units: 36, last: 10 } },
    cut: 15, from: d(10, 13), to: d(10, 22),
    normalUnits: 20, promoUnits: 48,
    clears: 28 * 3200, extraSales: 76_000, discountCost: 23_000,
    daily: { normal: spread(20, 10, 1), promo: spread(48, 10, 1) },
    steps: [{ kind: "add", task: promoTask("olive", 15, d(10, 22)) }],
  },
  {
    id: "icecream",
    productId: "icecream",
    reason: { key: "extraStock", detail: "seasonDown", params: { pct: 40 } },
    cut: 20, from: d(10, 13), to: d(10, 22),
    normalUnits: 30, promoUnits: 54,
    clears: 24 * 1800, extraSales: 35_000, discountCost: 19_000,
    daily: { normal: spread(30, 10, 3), promo: spread(54, 10, 3) },
    steps: [{ kind: "add", task: promoTask("icecream", 20, d(10, 22)) }],
  },
  {
    id: "cornflakes",
    productId: "cornflakes",
    reason: { key: "slowSeller", detail: "salesFell", params: { from: 20, to: 14 } },
    cut: 15, from: d(10, 16), to: d(10, 29),
    normalUnits: 28, promoUnits: 48,
    clears: 20 * 1600, extraSales: 27_000, discountCost: 11_500,
    daily: { normal: spread(28, 14, 5), promo: spread(48, 14, 5) },
    steps: [{ kind: "add", task: promoTask("cornflakes", 15, d(10, 29)) }],
  },
  {
    id: "ojuice",
    productId: "ojuice",
    reason: { key: "demandPeak", detail: "newYear", params: { pct: 40 } },
    cut: 10, from: d(11, 21), to: d(11, 31),
    normalUnits: 66, promoUnits: 121,
    clears: 0, extraSales: 37_000, discountCost: 9_000,
    daily: { normal: spread(66, 11, 2), promo: spread(121, 11, 2) },
    steps: [{ kind: "add", task: promoTask("ojuice", 10, d(11, 31)) }],
  },
  {
    // Approved by head office last week; drives the price-tag task on My store
    // today and the +160 milk in the Katnashkharh Dairy order suggestion.
    id: "weekend-dairy",
    productId: "milk32",
    productCount: 18,
    reason: { key: "demandPeak", detail: "weekendDairy", params: { units: 60 } },
    cut: 15, from: d(10, 13), to: d(10, 15),
    normalUnits: 460, promoUnits: 620,
    clears: 60 * 700, extraSales: 420_000, discountCost: 95_000,
    daily: { normal: [140, 170, 150], promo: [185, 230, 205] },
    approvedOn: d(10, 6),
    steps: [
      { kind: "orderExtra", supplierId: "dairyco", productId: "milk32", qty: 160 },
      { kind: "existing", taskKind: "promoTags", fallback: { kind: "promoTags", params: { count: 18, starts: d(10, 13) }, tag: "promo" } },
      { kind: "add", task: { kind: "clearSpace", params: { area: "dairyFridge" }, tag: "promo" } },
    ],
  },
];

const past = (id: string, productId: string, deal: PastPromo["deal"], from: Date, to: Date, liftPct: number, extraSales: number, discountCost: number, normalDay: number, note?: string): PastPromo => {
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const normal = spread(normalDay * days, days, id.length);
  return { id, productId, deal, from, to, liftPct, extraSales, discountCost, daily: { normal, promo: normal.map((v) => Math.round(v * (1 + liftPct / 100))) }, note };
};

const PAST: PastPromo[] = [
  past("cola", "cola15", { key: "threeForTwo" }, d(9, 16), d(9, 18), 62, 210_000, 70_000, 22),
  past("bread", "bread600", { key: "cut", params: { cut: 10 } }, d(9, 9), d(9, 11), 15, 28_000, 21_000, 58),
  past("olive-oct", "olive", { key: "cut", params: { cut: 10 } }, d(9, 2), d(9, 8), 12, 40_000, 55_000, 2, "tooSmall"),
  past("yogurt", "yogurt", { key: "cut", params: { cut: 15 } }, d(8, 25), d(8, 27), 38, 60_000, 30_000, 10, "leftover"),
  past("energy", "energy", { key: "twoForOne" }, d(8, 4), d(8, 6), 70, 50_000, 72_000, 6, "dipAfter"),
  past("icecream-aug", "icecream", { key: "cut", params: { cut: 20 } }, d(7, 21), d(7, 27), 45, 180_000, 65_000, 6),
];

const S03: StorePromotions = {
  ideas: IDEAS,
  past: PAST,
  extraSalesWeek: 160_000,
  extraSalesPct: 18,
  runningNow: [
    { productId: "coffee", deal: { key: "cut", params: { cut: 20 } } },
    { productId: "matsun", deal: { key: "twoForOne" } },
  ],
};

export const paidOff = (p: PastPromo) => p.extraSales > p.discountCost;

const cache = new Map<string, StorePromotions>();
export function getPromotions(storeId: string): StorePromotions {
  if (!cache.has(storeId)) {
    if (storeId === "s03") cache.set(storeId, S03);
    else {
      const n = Number(storeId.slice(1));
      const scale = 0.75 + ((n * 37) % 50) / 100;
      const m = (v: number) => Math.round((v * scale) / 1000) * 1000;
      cache.set(storeId, {
        ...S03,
        ideas: S03.ideas.map((i) => ({ ...i, clears: m(i.clears), extraSales: m(i.extraSales), discountCost: m(i.discountCost) })),
        past: S03.past.map((p) => ({ ...p, extraSales: m(p.extraSales), discountCost: m(p.discountCost) })),
        extraSalesWeek: m(S03.extraSalesWeek),
      });
    }
  }
  return cache.get(storeId)!;
}
