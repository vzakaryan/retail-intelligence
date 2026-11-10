import { useMemo } from "react";
import { getStoreDay, type Task } from "@/data/today";
import { useDemo, type TaskOverride } from "./DemoContext";

export interface TaskState extends Task {
  done: boolean;
  /** Set when the user completed it during the demo */
  doneNow?: TaskOverride["via"];
}

/** Today's tasks for a store, with whatever the user ticked off in the demo. */
export function useTasks(storeId: string) {
  const { taskOverrides } = useDemo();
  return useMemo(() => {
    const tasks: TaskState[] = getStoreDay(storeId).tasks.map((t) => {
      const o = taskOverrides[t.id];
      if (!o) return { ...t, done: !!t.doneAt };
      return { ...t, done: o.done, doneNow: o.done && !t.doneAt ? o.via : undefined };
    });
    const doneCount = tasks.filter((t) => t.done).length;
    return { tasks, doneCount, openCount: tasks.length - doneCount, total: tasks.length };
  }, [storeId, taskOverrides]);
}
