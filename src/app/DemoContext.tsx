import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_STORE_ID, DEMO_NOW, getStore } from "@/data/world";
import type { LineReview, Receipt } from "@/data/orders";
import type { NewTask } from "@/data/stockouts";
import type { Store } from "@/data/types";

/** What the user did to a task during the demo (overrides the mock data). */
export interface TaskOverride {
  done: boolean;
  /** How it was completed: ticked off, a call was logged, an order placed, or a delivery received */
  via?: "done" | "call" | "order" | "received";
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

  /** Orders the user marked as placed during the demo, with the day to check the delivery */
  placedOrders: Record<string, { checkOn: Date }>;
  markPlaced: (orderId: string, checkOn: Date) => void;

  /** Deliveries the user confirmed; null = undone */
  receipts: Record<string, Receipt>;
  setReceipt: (orderId: string, receipt: Receipt | null) => void;

  /** "Not yet, remind me tomorrow": how often, and the day of the next check, per order */
  snoozes: Record<string, Snooze>;
  /** Push the check to tomorrow; `undo` takes the last "not yet" back */
  snooze: (orderId: string, undo?: boolean) => void;

  /** Tasks added during the demo from Stockout risk / Online orders, keyed by id */
  addedTasks: Record<string, AddedTask>;
  addTask: (id: string, storeId: string, task: NewTask) => void;


  /** What happened to each suggested promotion during the demo, keyed by `${storeId}:${ideaId}` */
  promoDecisions: Record<string, PromoDecision>;
  setPromoDecision: (key: string, decision: PromoDecision | null) => void;

  /** Suppliers for which order suggestions keep 1 extra day of safety stock */
  extraSafety: Record<string, true>;
  toggleExtraSafety: (supplierId: string) => void;
}

export type RejectReason = "headOffice" | "margin" | "timing" | "other";
export type PromoDecision = { status: "sent" } | { status: "approved" } | { status: "rejected"; reason?: RejectReason };

export interface Snooze {
  count: number;
  until: Date;
  /** Check day before this "not yet", restored by undo */
  prev?: Date;
}

export interface AddedTask {
  storeId: string;
  task: NewTask;
  /** Insertion order, so added tasks keep a stable position */
  seq: number;
}

const DemoContext = createContext<DemoState | null>(null);

export const lineKey = (orderId: string, productId: string) => `${orderId}:${productId}`;

/** Demo state lives in memory only: a page reload resets the demo. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState(DEFAULT_STORE_ID);
  const [taskOverrides, setOverrides] = useState<Record<string, TaskOverride>>({});
  const [lineReviews, setReviews] = useState<Record<string, LineReview | null>>({});
  const [placedOrders, setPlaced] = useState<Record<string, { checkOn: Date }>>({});
  const [receipts, setReceipts] = useState<Record<string, Receipt>>({});
  const [snoozes, setSnoozes] = useState<Record<string, Snooze>>({});
  const [addedTasks, setAdded] = useState<Record<string, AddedTask>>({});
  const [extraSafety, setExtraSafety] = useState<Record<string, true>>({});
  const [promoDecisions, setPromoDecisions] = useState<Record<string, PromoDecision>>({});
  const setPromoDecision = useCallback((key: string, decision: PromoDecision | null) => {
    setPromoDecisions((prev) => {
      const next = { ...prev };
      if (decision) next[key] = decision;
      else delete next[key];
      return next;
    });
  }, []);

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
  const markPlaced = useCallback((orderId: string, checkOn: Date) => setPlaced((prev) => ({ ...prev, [orderId]: { checkOn } })), []);
  const setReceipt = useCallback((orderId: string, receipt: Receipt | null) => {
    setReceipts((prev) => {
      const next = { ...prev };
      if (receipt) next[orderId] = receipt;
      else delete next[orderId];
      return next;
    });
  }, []);
  const snooze = useCallback(
    (orderId: string, undo = false) =>
      setSnoozes((prev) => {
        const next = { ...prev };
        const cur = prev[orderId];
        if (undo) {
          if (!cur) return prev;
          if (cur.count <= 1 || !cur.prev) delete next[orderId];
          else next[orderId] = { count: cur.count - 1, until: cur.prev };
        } else {
          const tomorrow = new Date(DEMO_NOW.getFullYear(), DEMO_NOW.getMonth(), DEMO_NOW.getDate() + 1);
          next[orderId] = { count: (cur?.count ?? 0) + 1, until: tomorrow, prev: cur?.until };
        }
        return next;
      }),
    []
  );
  const addTask = useCallback((id: string, storeId: string, task: NewTask) => {
    setAdded((prev) => (prev[id] ? prev : { ...prev, [id]: { storeId, task, seq: Object.keys(prev).length } }));
  }, []);
  const toggleExtraSafety = useCallback((supplierId: string) => {
    setExtraSafety((prev) => {
      const next = { ...prev };
      if (next[supplierId]) delete next[supplierId];
      else next[supplierId] = true;
      return next;
    });
  }, []);

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
      receipts,
      setReceipt,
      snoozes,
      snooze,
      addedTasks,
      addTask,
      extraSafety,
      toggleExtraSafety,
      promoDecisions,
      setPromoDecision,
    }),
    [extraSafety, toggleExtraSafety, promoDecisions, setPromoDecision, storeId, taskOverrides, setTaskDone, lineReviews, setLineReview, setLineReviews, placedOrders, markPlaced, receipts, setReceipt, snoozes, snooze, addedTasks, addTask]
  );
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
