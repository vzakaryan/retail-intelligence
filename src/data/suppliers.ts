import type { NewTask } from "./stockouts";
import type { TaskParam } from "./today";

/**
 * Supplier reliability per store — docs/design-references/approved/15–16.
 * Store 03 is hand-crafted; other stores reuse it with scaled money values.
 */

export type SupplierStatus = "unreliable" | "watch" | "reliable";

export interface SupplierStats {
  supplierId: string;
  deliveries: number;
  late: number;
  /** Share of ordered units that arrived, % */
  inFull: number;
  /** Usual delay when late, e.g. { key: "days", value: 1.2 } */
  delay?: { unit: "days" | "hours" | "minutes"; value: number };
  /** Lost sales caused by late or short deliveries, AMD, last 4 weeks */
  lostSales: number;
  deliveryDays: { key: string };
  rep: { en: string; hy: string };
  /** Days late of the last 8 deliveries, oldest first (0 = on time) */
  last8: { date: Date; daysLate: number }[];
  /** Times a product ran out because of this supplier */
  stockouts: number;
  /** A task the store can do about it (e.g. call, ask for earlier delivery) */
  action?: { kind: "call"; due: Date; qty: number } | { kind: "task"; task: NewTask };
}

export interface Delivery {
  supplierId: string;
  when: Date;
  time?: string;
  status: "onTime" | "late" | "short";
  detail: { key: string; params?: Record<string, TaskParam> };
}

export interface StoreSuppliers {
  stats: SupplierStats[];
  inFullDeltaPp: number;
  onTimeDeltaPp: number;
  lateDelta: number;
  recent: Delivery[];
  /** Weekly on-time %: worst supplier vs. all others */
  trend: { weeks: Date[]; worst: number[]; others: number[] };
}

const d = (m: number, day: number) => new Date(2026, m, day);
const on = (dates: [number, number][]) => dates.map(([m, day]) => ({ date: d(m, day), daysLate: 0 }));

const S03: StoreSuppliers = {
  stats: [
    {
      supplierId: "agrieggs", deliveries: 8, late: 3, inFull: 88, delay: { unit: "days", value: 1.2 }, lostSales: 310_000,
      deliveryDays: { key: "monThu" }, rep: { en: "Aram B.", hy: "Արամ Բ." }, stockouts: 4,
      last8: [...on([[8, 14], [8, 17], [8, 28]]), { date: d(9, 1), daysLate: 1 }, ...on([[9, 15]]), { date: d(9, 22), daysLate: 2 }, ...on([[10, 5]]), { date: d(10, 9), daysLate: 1 }],
      action: { kind: "call", due: d(10, 9), qty: 240 },
    },
    {
      supplierId: "bevco", deliveries: 12, late: 2, inFull: 93, delay: { unit: "hours", value: 1.5 }, lostSales: 140_000,
      deliveryDays: { key: "monWedFri" }, rep: { en: "Lusine K.", hy: "Լուսինե Կ." }, stockouts: 2,
      last8: [...on([[9, 19], [9, 21], [9, 23]]), { date: d(9, 26), daysLate: 0.1 }, ...on([[9, 28], [9, 30], [10, 2]]), { date: d(10, 6), daysLate: 0.05 }],
      action: { kind: "task", task: { kind: "askSupplier", supplierId: "bevco", params: { time: "10:00" }, tag: "supplier" } },
    },
    {
      supplierId: "freshbake", deliveries: 28, late: 3, inFull: 97, delay: { unit: "minutes", value: 35 }, lostSales: 95_000,
      deliveryDays: { key: "daily" }, rep: { en: "Gevorg M.", hy: "Գևորգ Մ." }, stockouts: 3,
      last8: [...on([[10, 3], [10, 4], [10, 5]]), { date: d(10, 6), daysLate: 0.03 }, ...on([[10, 7], [10, 8], [10, 9], [10, 10]])],
      action: { kind: "task", task: { kind: "askSupplier", supplierId: "freshbake", params: { time: "15:00" }, tag: "supplier" } },
    },
    {
      supplierId: "dairyco", deliveries: 12, late: 1, inFull: 98, delay: { unit: "minutes", value: 20 }, lostSales: 45_000,
      deliveryDays: { key: "tueThuSat" }, rep: { en: "Ruzanna H.", hy: "Ռուզաննա Հ." }, stockouts: 1,
      last8: [...on([[9, 20], [9, 22], [9, 24], [9, 27], [9, 29], [9, 31]]), { date: d(10, 3), daysLate: 0.02 }, ...on([[10, 7]])],
    },
    {
      supplierId: "coldfoods", deliveries: 4, late: 0, inFull: 96, lostSales: 20_000,
      deliveryDays: { key: "weekly" }, rep: { en: "Arman V.", hy: "Արման Վ." }, stockouts: 0,
      last8: on([[8, 21], [8, 28], [9, 5], [9, 12], [9, 19], [9, 26], [10, 2], [10, 9]]),
    },
    {
      supplierId: "groceryhub", deliveries: 4, late: 0, inFull: 99, lostSales: 10_000,
      deliveryDays: { key: "weekly" }, rep: { en: "Nare S.", hy: "Նարե Ս." }, stockouts: 0,
      last8: on([[8, 18], [8, 25], [9, 2], [9, 9], [9, 16], [9, 23], [9, 30], [10, 6]]),
    },
  ],
  inFullDeltaPp: 1.2,
  onTimeDeltaPp: 3,
  lateDelta: -4,
  recent: [
    { supplierId: "freshbake", when: d(10, 10), time: "07:00", status: "onTime", detail: { key: "onTimeAll", params: { n: 6 } } },
    { supplierId: "agrieggs", when: d(10, 9), status: "late", detail: { key: "notArrived", params: { days: 1, qty: 240 } } },
    { supplierId: "bevco", when: d(10, 9), status: "short", detail: { key: "short", params: { missing: 12, ordered: 64, product: "cola15" } } },
    { supplierId: "freshbake", when: d(10, 9), status: "onTime", detail: { key: "onTime" } },
    { supplierId: "dairyco", when: d(10, 8), status: "onTime", detail: { key: "onTimeAll", params: { n: 14 } } },
  ],
  trend: {
    weeks: Array.from({ length: 8 }, (_, i) => new Date(2026, 8, 14 + i * 7)),
    worst: [96, 92, 90, 84, 78, 72, 67, 63],
    others: [90, 91, 90, 92, 91, 93, 92, 93],
  },
};

export const onTimePct = (s: SupplierStats) => Math.round(((s.deliveries - s.late) / s.deliveries) * 100);
export const statusOf = (s: SupplierStats): SupplierStatus => (onTimePct(s) < 75 ? "unreliable" : onTimePct(s) < 90 ? "watch" : "reliable");

const cache = new Map<string, StoreSuppliers>();
export function getSuppliers(storeId: string): StoreSuppliers {
  if (!cache.has(storeId)) {
    if (storeId === "s03") cache.set(storeId, S03);
    else {
      const n = Number(storeId.slice(1));
      const scale = 0.75 + ((n * 37) % 50) / 100;
      cache.set(storeId, { ...S03, stats: S03.stats.map((s) => ({ ...s, lostSales: Math.round((s.lostSales * scale) / 5000) * 5000 })) });
    }
  }
  return cache.get(storeId)!;
}
