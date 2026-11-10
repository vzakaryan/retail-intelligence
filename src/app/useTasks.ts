import { useMemo } from "react";
import { getOrders } from "@/data/orders";
import { getStoreDay, type Task } from "@/data/today";
import { useDemo, type TaskOverride } from "./DemoContext";

export interface TaskState extends Task {
  done: boolean;
  /** Set when the user completed it during the demo */
  doneNow?: TaskOverride["via"];
}

/** The open supplier order a "Review the … order" task points to. */
export function orderIdForTask(storeId: string, task: Task): string | undefined {
  if (task.kind !== "reviewOrder") return undefined;
  return getOrders(storeId).find((o) => o.supplierId === task.supplierId && o.status === "toPlace")?.id;
}

/** Today's tasks for a store, with whatever the user did in the demo. */
export function useTasks(storeId: string) {
  const { taskOverrides, placedOrders } = useDemo();
  return useMemo(() => {
    const tasks: TaskState[] = getStoreDay(storeId).tasks.map((t) => {
      // Placing an order completes its "review the order" task.
      const orderId = orderIdForTask(storeId, t);
      if (orderId && placedOrders[orderId]) return { ...t, done: true, doneNow: "order" };
      const o = taskOverrides[t.id];
      if (!o) return { ...t, done: !!t.doneAt };
      return { ...t, done: o.done, doneNow: o.done && !t.doneAt ? o.via : undefined };
    });
    const doneCount = tasks.filter((t) => t.done).length;
    return { tasks, doneCount, openCount: tasks.length - doneCount, total: tasks.length };
  }, [storeId, taskOverrides, placedOrders]);
}
