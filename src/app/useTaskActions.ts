import { useCallback } from "react";
import type { NewTask } from "@/data/stockouts";
import { newTaskId } from "@/data/stockouts";
import type { TaskKind } from "@/data/today";
import { useDemo } from "./DemoContext";
import { useTasks, type TaskState } from "./useTasks";

export interface TaskRef {
  task: NewTask;
  /** Prefer an existing task on today's list that does the same thing */
  linked?: { kind: TaskKind; productId?: string; supplierId?: string };
}

/**
 * Bridges suggestions on other screens and "My store today":
 * the same suggestion maps to one task, so ticking it off anywhere updates everywhere.
 */
export function useTaskActions(storeId: string) {
  const { tasks } = useTasks(storeId);
  const { addTask, setTaskDone } = useDemo();

  const find = useCallback(
    (ref: TaskRef): TaskState | undefined => {
      if (ref.linked) {
        const l = ref.linked;
        const existing = tasks.find(
          (t) => t.kind === l.kind && (!l.productId || t.productId === l.productId) && (!l.supplierId || t.supplierId === l.supplierId)
        );
        if (existing) return existing;
      }
      const id = newTaskId(storeId, ref.task);
      return tasks.find((t) => t.id === id);
    },
    [tasks, storeId]
  );

  /** Put the task on today's list (no-op if it's already there) */
  const add = useCallback(
    (ref: TaskRef) => {
      if (find(ref)) return;
      addTask(newTaskId(storeId, ref.task), storeId, ref.task);
    },
    [find, addTask, storeId]
  );

  /** Mark it done, adding it to today's list first if needed */
  const complete = useCallback(
    (ref: TaskRef, done = true, via: "done" | "call" = "done") => {
      const existing = find(ref);
      if (existing) return setTaskDone(existing.id, done, via);
      const id = newTaskId(storeId, ref.task);
      addTask(id, storeId, ref.task);
      setTaskDone(id, done, via);
    },
    [find, addTask, setTaskDone, storeId]
  );

  return { find, add, complete, tasks };
}
