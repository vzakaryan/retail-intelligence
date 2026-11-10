import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_STORE_ID, getStore } from "@/data/world";
import type { Store } from "@/data/types";

interface DemoState {
  /** The store shown in store-level screens. */
  store: Store;
  setStoreId: (id: string) => void;
}

const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState(DEFAULT_STORE_ID);
  const value = useMemo(() => ({ store: getStore(storeId), setStoreId }), [storeId]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
