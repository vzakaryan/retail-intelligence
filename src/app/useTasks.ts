import { useMemo } from "react";
import { getOnline } from "@/data/online";
import { getOrders } from "@/data/orders";
import { newTaskId } from "@/data/stockouts";
import { getStoreDay, type Task } from "@/data/today";
import { useDemo, type TaskOverride } from "./DemoContext";
import { useOrders } from "./useOrders";
import { sectionOn } from "./features";

export interface TaskState extends Task {
  done: boolean;
  /** Set when the user completed it during the demo */
  doneNow?: TaskOverride["via"];
  /** checkDelivery tasks: the placed order to confirm */
  orderId?: string;
  /** checkDelivery tasks: times the manager answered "not yet" */
  snoozed?: number;
  /** checkDelivery tasks: days past the check day */
  checkOverdue?: number;
}

/** The open supplier order a "Review the … order" task points to. */
export function orderIdForTask(storeId: string, task: Task): string | undefined {
  if (task.kind !== "reviewOrder") return undefined;
  return getOrders(storeId).find((o) => o.supplierId === task.supplierId && o.status === "toPlace")?.id;
}

/** Today's tasks for a store, with whatever the user did in the demo. */
export function useTasks(storeId: string) {
  const { taskOverrides, placedOrders, addedTasks } = useDemo();
  const orders = useOrders(storeId);
  return useMemo(() => {
    // Tasks added from Stockout risk / Online orders appear after the planned ones.
    const added: Task[] = Object.entries(addedTasks)
      .filter(([, a]) => a.storeId === storeId)
      .sort((a, b) => a[1].seq - b[1].seq)
      .map(([id, a]) => ({ id, ...a.task, action: "markDone" as const }));

    // "Did the order arrive?" for orders placed during the demo whose check day has come
    // (orders placed before the demo already have this task in the mock data).
    const planned = getStoreDay(storeId).tasks;
    const checks: Task[] = orders
      .filter((o) => o.placedNow && o.checkOn && (o.needsCheck || o.receipt))
      .filter((o) => !planned.some((t) => t.kind === "checkDelivery" && t.supplierId === o.order.supplierId))
      .map((o) => ({ id: `${o.order.id}-check`, kind: "checkDelivery", supplierId: o.order.supplierId, params: { due: o.checkOn! }, tag: "supplier", action: "checkDelivery" }));

    // Today's "prepare before picking" items from Online orders are tasks too (one list).
    // Items that point to a task already on the list (e.g. the eggs refill) aren't repeated.
    const prep: Task[] = getOnline(storeId)
      .days.today.prep.filter((p) => !p.linkedTask || !planned.some((t) => t.kind === p.linkedTask!.kind && t.productId === p.linkedTask!.productId))
      .map((p) => ({ id: newTaskId(storeId, p.task), ...p.task, action: "markDone" as const, doneAt: p.doneAt }));
    const seen = new Set<string>();
    const all = [...planned, ...checks, ...prep, ...added].filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));

    const tasks: TaskState[] = [];
    for (const t of all) {
      if (t.kind === "checkDelivery") {
        // MVP: no delivery check / receiving
        if (!sectionOn("orderReceiving")) continue;
        const o = orders.find((x) => x.order.supplierId === t.supplierId && x.stage !== "notStarted" && x.stage !== "inReview" && x.stage !== "ready");
        if (!o) continue;
        if (o.receipt) {
          tasks.push({ ...t, orderId: o.order.id, done: true, doneNow: "received" });
          continue;
        }
        // "Not yet" moved the check to a later day: no task today
        if (!o.needsCheck) continue;
        tasks.push({ ...t, orderId: o.order.id, snoozed: o.snoozed, checkOverdue: o.checkOverdue, done: false });
        continue;
      }
      // Placing an order completes its "review the order" task.
      const orderId = orderIdForTask(storeId, t);
      if (orderId && placedOrders[orderId]) {
        tasks.push({ ...t, done: true, doneNow: "order" });
        continue;
      }
      const ov = taskOverrides[t.id];
      if (!ov) tasks.push({ ...t, done: !!t.doneAt });
      else tasks.push({ ...t, done: ov.done, doneNow: ov.done && !t.doneAt ? ov.via : undefined });
    }
    const doneCount = tasks.filter((t) => t.done).length;
    return { tasks, doneCount, openCount: tasks.length - doneCount, total: tasks.length };
  }, [storeId, taskOverrides, placedOrders, addedTasks, orders]);
}
