import { useMemo } from "react";
import { useTasks } from "@/app/useTasks";

/** Products whose "refill from backroom" task is done today. */
export function useRefilled(storeId: string): Set<string> {
  const { tasks } = useTasks(storeId);
  return useMemo(
    () => new Set(tasks.filter((t) => t.done && (t.kind === "refill" || t.kind === "refillOnline") && t.productId).map((t) => t.productId!)),
    [tasks]
  );
}
