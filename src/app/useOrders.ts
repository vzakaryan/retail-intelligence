import { useMemo } from "react";
import { coverDays, getOrders, suggestedQty, type LineReview, type OrderLine, type SupplierOrder } from "@/data/orders";
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

export type OrderStage = "notStarted" | "inReview" | "ready" | "placed";

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
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Supplier orders for a store, merged with what the user did in the demo. */
export function useOrders(storeId: string): OrderView[] {
  const { lineReviews, placedOrders, extraSafety } = useDemo();
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
        const stage: OrderStage = placed
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
        };
      }),
    [storeId, lineReviews, placedOrders, extraSafety]
  );
}

export function useOrder(storeId: string, orderId: string | undefined): OrderView | undefined {
  return useOrders(storeId).find((o) => o.order.id === orderId);
}
