import type { TFunction } from "i18next";
import type { OrderView } from "@/app/useOrders";
import type { Localized, Store } from "@/data/types";
import { fmtDate } from "@/lib/format";

type Loc = (text: Localized) => string;

const orderedLines = (view: OrderView) => view.lines.filter((l) => (l.review?.qty ?? 0) > 0);
const day = (d: Date) => fmtDate(d, { weekday: "short", month: "short", day: "numeric" });

/** Plain-text order to paste into email, Viber or WhatsApp. */
export function orderAsText(t: TFunction, loc: Loc, view: OrderView, store: Store): string {
  const lines = orderedLines(view).map((l) => `• ${loc(l.product.name)} — ${l.review!.qty}`);
  return [
    t("orders.sheet.heading", { supplier: view.supplier.name, store: `${store.code} ${loc(store.name)}` }),
    t("orders.sheet.delivery", { date: day(view.order.delivery) }),
    "",
    ...lines,
    "",
    t("orders.sheet.total", { count: lines.length, units: view.units }),
  ].join("\n");
}

/** Downloads the order as a CSV file that opens in Excel. */
export function downloadOrderSheet(t: TFunction, loc: Loc, view: OrderView, store: Store) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [
    [t("orders.sheet.colSku"), t("orders.sheet.colProduct"), t("orders.sheet.colQty")],
    ...orderedLines(view).map((l) => [l.product.sku, loc(l.product.name), l.review!.qty]),
  ];
  const meta = [
    [t("orders.sheet.heading", { supplier: view.supplier.name, store: `${store.code} ${loc(store.name)}` })],
    [t("orders.sheet.delivery", { date: day(view.order.delivery) })],
    [],
  ];
  const csv = "﻿" + [...meta, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${view.supplier.name}-order-${store.code.replace("#", "store")}-${view.order.delivery.toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
