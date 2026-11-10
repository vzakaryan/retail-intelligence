import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_STORE_ID, getStore } from "@/data/world";
import type { Store } from "@/data/types";

/** What the user did to a task during the demo (overrides the mock data). */
export interface TaskOverride {
  done: boolean;
  /** How it was completed: ticked off, or a call was logged */
  via?: "done" | "call";
}

interface DemoState {
  /** The store shown in store-level screens. */
  store: Store;
  setStoreId: (id: string) => void;
  taskOverrides: Record<string, TaskOverride>;
  setTaskDone: (taskId: string, done: boolean, via?: TaskOverride["via"]) => void;
}

const DemoContext = createContext<DemoState | null>(null);

/** Demo state lives in memory only: a page reload resets the demo. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState(DEFAULT_STORE_ID);
  const [taskOverrides, setOverrides] = useState<Record<string, TaskOverride>>({});

  const setTaskDone = useCallback((taskId: string, done: boolean, via: TaskOverride["via"] = "done") => {
    setOverrides((prev) => ({ ...prev, [taskId]: { done, via } }));
  }, []);

  const value = useMemo(
    () => ({ store: getStore(storeId), setStoreId, taskOverrides, setTaskDone }),
    [storeId, taskOverrides, setTaskDone]
  );
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
