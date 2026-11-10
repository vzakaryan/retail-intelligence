import { DEMO_NOW, getStore } from "./world";

/**
 * Supplier orders per store — matches docs/design-references/approved/02–05.
 * Store 03 is hand-crafted; other stores reuse it with scaled numbers.
 *
 * The product never places orders itself: the store manager reviews the
 * suggested quantities, orders the usual way (phone, email, Excel) and then
 * tells us it's placed.
 */

export type ReasonKey = "weekend" | "usual" | "ranOutTwice" | "enoughExpiring" | "ranOutSunday" | "sellingFaster" | "weekendBaking" | "lowStock";

export type ChangeReason = "shelfSpace" | "promo" | "lowerDemand" | "higherDemand" | "packSize" | "other";

export interface LineReview {
  status: "accepted" | "changed" | "notNeeded";
  qty: number;
  reason?: ChangeReason;
}

export interface PastSuggestion {
  date: Date;
  suggested: number;
  ordered: number;
  /** Time the shelf ran empty, if it did */
  ranOutAt?: { day: Date; time: string };
}

export interface OrderLine {
  productId: string;
  inStore: number;
  onTheWay: number;
  /** Expected sales until the next delivery after this one */
  expected: number;
  safetyStock: number;
  reason: { key: ReasonKey; pct?: number };
  /** Review made before the demo starts (e.g. Anna already reviewed 6 lines). */
  initialReview?: LineReview;
}

export interface SupplierOrder {
  id: string;
  storeId: string;
  supplierId: string;
  status: "toPlace" | "placed";
  /** Order must be placed by */
  deadline: Date;
  delivery: Date;
  /** Delivery time if known, e.g. "07:00" */
  deliveryTime?: string;
  /** Order should last until the next delivery on this day */
  coversUntil: Date;
  lines: OrderLine[];
  /** For orders placed before the demo starts */
  placedOn?: Date;
  late?: { daysLate: number; daysOfStockLeft: number };
}

const d = (day: number, h = 0, m = 0) => new Date(2026, 10, day, h, m);

/** suggested = expected + safety stock − in store − on the way (never below 0) */
export function suggestedQty(line: OrderLine): number {
  return Math.max(0, line.expected + line.safetyStock - line.inStore - line.onTheWay);
}

const L = (
  productId: string,
  inStore: number,
  onTheWay: number,
  expected: number,
  safetyStock: number,
  reason: OrderLine["reason"]["key"],
  initialReview?: LineReview,
  pct?: number
): OrderLine => ({ productId, inStore, onTheWay, expected, safetyStock, reason: { key: reason, pct }, initialReview });

const ok = (qty: number): LineReview => ({ status: "accepted", qty });

// ---------------------------------------------------------------- Store 03

const S03_ORDERS: Omit<SupplierOrder, "id" | "storeId">[] = [
  {
    supplierId: "dairyco",
    status: "toPlace",
    deadline: d(10, 16),
    delivery: d(12),
    coversUntil: d(14),
    lines: [
      L("milk32", 120, 50, 410, 60, "weekend", ok(300), 20),
      L("milk25", 80, 0, 190, 10, "usual", ok(120)),
      L("kefir", 45, 0, 96, 9, "usual", { status: "changed", qty: 50, reason: "shelfSpace" }),
      L("matsun", 30, 0, 85, 5, "ranOutTwice", ok(60)),
      L("tan", 30, 0, 66, 12, "usual", ok(48)),
      L("yogurt", 92, 0, 70, 15, "enoughExpiring", { status: "notNeeded", qty: 0 }),
      L("sourcream", 19, 5, 64, 20, "ranOutSunday"),
      L("butter", 34, 0, 48, 10, "usual"),
      L("cheese", 22, 0, 30, 4, "usual"),
      L("cottage", 18, 0, 44, 14, "sellingFaster"),
      L("cream10", 14, 0, 32, 12, "weekendBaking", undefined, 25),
      L("lori", 20, 0, 26, 12, "usual"),
      L("chanakh", 16, 0, 22, 9, "usual"),
      L("milk15", 40, 0, 58, 18, "usual"),
    ],
  },
  {
    supplierId: "freshbake",
    status: "toPlace",
    deadline: d(10, 20),
    delivery: d(11),
    deliveryTime: "07:00",
    coversUntil: d(12),
    lines: [
      L("bread600", 14, 0, 96, 18, "lowStock"),
      L("rye", 8, 0, 40, 8, "usual"),
      L("lavash", 20, 0, 70, 10, "usual"),
      L("matnakash", 6, 0, 44, 8, "sellingFaster"),
      L("croissant", 10, 0, 36, 6, "usual"),
      L("buns", 5, 0, 24, 5, "usual"),
    ],
  },
  {
    supplierId: "bevco",
    status: "toPlace",
    deadline: d(11, 12),
    delivery: d(12),
    coversUntil: d(16),
    lines: [
      L("cola15", 6, 0, 110, 22, "lowStock"),
      L("cola05", 30, 0, 90, 15, "usual"),
      L("water15", 60, 0, 150, 30, "usual"),
      L("sparkling", 40, 0, 80, 16, "usual"),
      L("ojuice", 18, 0, 42, 8, "usual"),
      L("ajuice", 20, 0, 34, 7, "usual"),
      L("lemonade", 12, 0, 36, 7, "weekend", undefined, 15),
      L("icetea", 15, 0, 30, 6, "usual"),
      L("energy", 25, 0, 40, 8, "usual"),
    ],
  },
  {
    supplierId: "agrieggs",
    status: "placed",
    placedOn: d(6),
    deadline: d(6, 12),
    delivery: d(9),
    coversUntil: d(13),
    late: { daysLate: 1, daysOfStockLeft: 2 },
    lines: [
      L("eggs10", 49, 0, 260, 40, "usual", ok(240)),
      L("eggs6", 30, 0, 90, 15, "usual", ok(80)),
      L("eggs30", 8, 0, 30, 6, "usual", ok(30)),
    ],
  },
  {
    supplierId: "bevco",
    status: "placed",
    placedOn: d(9),
    deadline: d(9, 12),
    delivery: d(11),
    deliveryTime: "09:00",
    coversUntil: d(12),
    lines: [
      L("cola15", 6, 0, 60, 10, "usual", ok(64)),
      L("cola05", 30, 0, 50, 8, "usual", ok(28)),
      L("water15", 60, 0, 90, 15, "usual", ok(45)),
      L("sparkling", 40, 0, 50, 8, "usual", ok(18)),
      L("ojuice", 18, 0, 24, 4, "usual", ok(10)),
      L("lemonade", 12, 0, 20, 4, "usual", ok(12)),
      L("icetea", 15, 0, 18, 3, "usual", ok(6)),
      L("energy", 25, 0, 24, 4, "usual", ok(3)),
    ],
  },
];

function withIds(storeId: string, orders: Omit<SupplierOrder, "id" | "storeId">[]): SupplierOrder[] {
  return orders.map((o) => ({
    ...o,
    storeId,
    id: `${storeId}-${o.supplierId}-${o.placedOn ? "p" : ""}${o.delivery.getDate()}`,
  }));
}

// ------------------------------------------------- Other stores (derived)

function deriveOrders(storeId: string): SupplierOrder[] {
  const store = getStore(storeId);
  const n = Number(storeId.slice(1));
  const scale = 0.75 + ((n * 37) % 50) / 100; // 0.75 – 1.24
  const sc = (v: number) => Math.max(0, Math.round(v * scale));

  const base = S03_ORDERS.map((o) => ({
    ...o,
    lines: o.lines.map((l) => ({
      ...l,
      inStore: sc(l.inStore),
      onTheWay: sc(l.onTheWay),
      expected: sc(l.expected),
      safetyStock: sc(l.safetyStock),
      // Only Store 03's manager has started reviewing; placed orders keep their quantities.
      initialReview: o.status === "placed" && l.initialReview ? { ...l.initialReview, qty: sc(l.initialReview.qty) } : undefined,
    })),
  }));

  const due = store.today.ordersDueToday;
  // 1 order due today → FreshBake moves to tomorrow; 3 → BevCo is due today too.
  if (due === 1) base[1] = { ...base[1], deadline: d(11, 20), delivery: d(12), coversUntil: d(13) };
  if (due >= 3) base[2] = { ...base[2], deadline: d(10, 18) };
  return withIds(storeId, base);
}

const cache = new Map<string, SupplierOrder[]>();

export function getOrders(storeId: string): SupplierOrder[] {
  if (!cache.has(storeId)) cache.set(storeId, storeId === "s03" ? withIds("s03", S03_ORDERS) : deriveOrders(storeId));
  return cache.get(storeId)!;
}

export function findOrder(storeId: string, orderId: string): SupplierOrder | undefined {
  return getOrders(storeId).find((o) => o.id === orderId);
}

// ------------------------------------------------------ "Why?" details

const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());

/** First day counted in "expected sales" (tomorrow) */
export function coverStart(): Date {
  const t = startOfDay(DEMO_NOW);
  t.setDate(t.getDate() + 1);
  return t;
}

/** Number of days from tomorrow until the day the order must last to */
export function coverDays(order: SupplierOrder): number {
  return Math.max(1, Math.round((startOfDay(order.coversUntil).getTime() - startOfDay(DEMO_NOW).getTime()) / 86_400_000));
}

export interface LineInsight {
  /** Daily units sold over the last 14 days (oldest first) */
  sold: number[];
  /** Index into `sold` of a day the shelf was empty, if any */
  stockoutDay?: number;
  /** Expected daily sales for the days the order must cover */
  expectedDaily: number[];
  history: PastSuggestion[];
}

/** Sales history and past suggestions behind a suggested quantity. */
export function getLineInsight(order: SupplierOrder, line: OrderLine): LineInsight {
  const days = coverDays(order);
  if (order.storeId === "s03" && line.productId === "sourcream") {
    return {
      sold: [14, 15, 13, 17, 19, 22, 12, 15, 14, 16, 18, 9, 21, 13],
      stockoutDay: 11,
      expectedDaily: [14, 15, 16, 19],
      history: [
        { date: d(7), suggested: 55, ordered: 40, ranOutAt: { day: d(8), time: "17:00" } },
        { date: d(3), suggested: 50, ordered: 50 },
        { date: new Date(2026, 9, 31), suggested: 48, ordered: 48 },
      ],
    };
  }
  // Deterministic "noise" from the product id
  const seed = [...line.productId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const avg = line.expected / days;
  const wiggle = (i: number) => 0.8 + (((seed * (i + 3)) % 41) / 100);
  const sold = Array.from({ length: 14 }, (_, i) => Math.max(0, Math.round(avg * wiggle(i))));
  const ranOut = line.reason.key === "ranOutTwice" || line.reason.key === "lowStock";
  const stockoutDay = ranOut ? 11 : undefined; // Sun, Nov 8 — matches the "ran out" history entry
  if (stockoutDay !== undefined) sold[stockoutDay] = Math.round(sold[stockoutDay] * 0.5);
  const expectedDaily = Array.from({ length: days }, (_, i) => Math.round(avg * (0.9 + i * 0.07)));
  const sug = suggestedQty(line);
  return {
    sold,
    stockoutDay,
    expectedDaily,
    history: [
      { date: d(7), suggested: Math.round(sug * 0.95), ordered: Math.round(sug * (ranOut ? 0.75 : 0.95)), ranOutAt: ranOut ? { day: d(8), time: "18:00" } : undefined },
      { date: d(3), suggested: Math.round(sug * 0.9), ordered: Math.round(sug * 0.9) },
      { date: new Date(2026, 9, 31), suggested: Math.round(sug * 0.85), ordered: Math.round(sug * 0.85) },
    ],
  };
}
