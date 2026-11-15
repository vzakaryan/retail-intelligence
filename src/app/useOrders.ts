import { useMemo } from "react";
import { coverDays, getOrders, suggestedQty, type LineReview, type OrderLine, type Receipt, type SupplierOrder } from "@/data/orders";
import { getProduct, type Product } from "@/data/products";
import type { Supplier } from "@/data/types";
import { DEMO_NOW, SUPPLIERS } from "@/data/world";
import { lineKey, useDemo } from "./DemoContext";

export interface LineView {
  line: OrderLine;
  product: Product;
  suggested: number;
  /** Extra units added because head office / the manager asked for extra safety stock */
  extraSafety: number;
  /** Current review, or undefined while it still needs review */
  review?: LineReview;
}

export type OrderStage = "notStarted" | "inReview" | "ready" | "placed" | "received";

export interface OrderView {
  order: SupplierOrder;
  supplier: Supplier;
  lines: LineView[];
  reviewedCount: number;
  stage: OrderStage;
  /** Order value of the quantities decided so far, AMD */
  value: number;
  units: number;
  /** Placed during the demo (not before it) */
  placedNow: boolean;
  dueToday: boolean;
  /** Placed orders: day to check the delivery arrived (after any "not yet" reminders) */
  checkOn?: Date;
  /** Placed, not received, and the check day has come */
  needsCheck: boolean;
  /** Days past the check day (0 = check is today) */
  checkOverdue: number;
  /** Times the manager answered "not yet" */
  snoozed: number;
  receipt?: Receipt;
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
/** Whole days from a to b */
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);

/** Supplier orders for a store, merged with what the user did in the demo. */
export function useOrders(storeId: string): OrderView[] {
  const { lineReviews, placedOrders, extraSafety, receipts, snoozes } = useDemo();
  return useMemo(
    () =>
      getOrders(storeId).map((order) => {
        const lines = order.lines.map((line) => {
          const key = lineKey(order.id, line.productId);
          const review = key in lineReviews ? (lineReviews[key] ?? undefined) : line.initialReview;
          const extra = extraSafety[order.supplierId] ? Math.round(line.expected / coverDays(order)) : 0;
          return { line, product: getProduct(line.productId), suggested: suggestedQty(line) + extra, extraSafety: extra, review };
        });
        const reviewed = lines.filter((l) => l.review);
        const placedNow = !!placedOrders[order.id];
        const placed = order.status === "placed" || placedNow;
        const receipt = receipts[order.id];
        const sn = snoozes[order.id];
        const snoozed = sn?.count ?? 0;
        const checkOn = placed ? (sn?.until ?? placedOrders[order.id]?.checkOn ?? order.checkOn ?? order.delivery) : undefined;
        const overdue = checkOn ? daysBetween(checkOn, DEMO_NOW) : -1;
        const stage: OrderStage = receipt
          ? "received"
          : placed
          ? "placed"
          : reviewed.length === lines.length
            ? "ready"
            : reviewed.length > 0
              ? "inReview"
              : "notStarted";
        return {
          order,
          supplier: SUPPLIERS.find((s) => s.id === order.supplierId)!,
          lines,
          reviewedCount: reviewed.length,
          stage,
          value: reviewed.reduce((sum, l) => sum + l.review!.qty * l.product.price, 0),
          units: reviewed.reduce((sum, l) => sum + l.review!.qty, 0),
          placedNow,
          dueToday: !placed && sameDay(order.deadline, DEMO_NOW),
          checkOn,
          needsCheck: placed && !receipt && overdue >= 0,
          checkOverdue: Math.max(0, overdue),
          snoozed,
          receipt,
        };
      }),
    [storeId, lineReviews, placedOrders, extraSafety, receipts, snoozes]
  );
}

/** Placed or already received */
export const isPlaced = (v: OrderView) => v.stage === "placed" || v.stage === "received";

export function useOrder(storeId: string, orderId: string | undefined): OrderView | undefined {
  return useOrders(storeId).find((o) => o.order.id === orderId);
}
