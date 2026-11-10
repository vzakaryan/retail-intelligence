import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_STORE_ID, getStore } from "@/data/world";
import type { LineReview } from "@/data/orders";
import type { Store } from "@/data/types";

/** What the user did to a task during the demo (overrides the mock data). */
export interface TaskOverride {
  done: boolean;
  /** How it was completed: ticked off, a call was logged, or an order placed */
  via?: "done" | "call" | "order";
}

interface DemoState {
  /** The store shown in store-level screens. */
  store: Store;
  setStoreId: (id: string) => void;

  taskOverrides: Record<string, TaskOverride>;
  setTaskDone: (taskId: string, done: boolean, via?: TaskOverride["via"]) => void;

  /** Order line reviews keyed by `${orderId}:${productId}`; null = re-opened for review */
  lineReviews: Record<string, LineReview | null>;
  setLineReview: (orderId: string, productId: string, review: LineReview | null) => void;
  setLineReviews: (orderId: string, reviews: Record<string, LineReview>) => void;

  /** Orders the user marked as placed during the demo */
  placedOrders: Record<string, true>;
  markPlaced: (orderId: string) => void;

  howItWorksDismissed: boolean;
  dismissHowItWorks: () => void;
}

const DemoContext = createContext<DemoState | null>(null);

export const lineKey = (orderId: string, productId: string) => `${orderId}:${productId}`;

/** Demo state lives in memory only: a page reload resets the demo. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState(DEFAULT_STORE_ID);
  const [taskOverrides, setOverrides] = useState<Record<string, TaskOverride>>({});
  const [lineReviews, setReviews] = useState<Record<string, LineReview | null>>({});
  const [placedOrders, setPlaced] = useState<Record<string, true>>({});
  const [howItWorksDismissed, setDismissed] = useState(false);

  const setTaskDone = useCallback((taskId: string, done: boolean, via: TaskOverride["via"] = "done") => {
    setOverrides((prev) => ({ ...prev, [taskId]: { done, via } }));
  }, []);
  const setLineReview = useCallback((orderId: string, productId: string, review: LineReview | null) => {
    setReviews((prev) => ({ ...prev, [lineKey(orderId, productId)]: review }));
  }, []);
  const setLineReviews = useCallback((orderId: string, reviews: Record<string, LineReview>) => {
    setReviews((prev) => {
      const next = { ...prev };
      for (const [productId, r] of Object.entries(reviews)) next[lineKey(orderId, productId)] = r;
      return next;
    });
  }, []);
  const markPlaced = useCallback((orderId: string) => setPlaced((prev) => ({ ...prev, [orderId]: true })), []);
  const dismissHowItWorks = useCallback(() => setDismissed(true), []);

  const value = useMemo(
    () => ({
      store: getStore(storeId),
      setStoreId,
      taskOverrides,
      setTaskDone,
      lineReviews,
      setLineReview,
      setLineReviews,
      placedOrders,
      markPlaced,
      howItWorksDismissed,
      dismissHowItWorks,
    }),
    [storeId, taskOverrides, setTaskDone, lineReviews, setLineReview, setLineReviews, placedOrders, markPlaced, howItWorksDismissed, dismissHowItWorks]
  );
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
