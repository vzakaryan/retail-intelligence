import { useMemo } from "react";
import { useDemo } from "@/app/DemoContext";
import { useTaskActions, type TaskRef } from "@/app/useTaskActions";
import { getOnline, type AtRiskOrder, type OnlineDay, type PrepItem, type Slot } from "@/data/online";

export const prepRef = (p: PrepItem): TaskRef => ({ task: p.task, linked: p.linkedTask });

/** Online orders merged with what was done in the demo (prep tasks, customers contacted). */
export function useOnlineState(storeId: string, day: OnlineDay) {
  const data = getOnline(storeId);
  const d = data.days[day];
  const actions = useTaskActions(storeId);
  const { contactedOrders } = useDemo();

  return useMemo(() => {
    const prepDone = (p: PrepItem) => !!p.doneAt || !!actions.find(prepRef(p))?.done;
    const prepById = Object.fromEntries(d.prep.map((p) => [p.id, p]));
    const orderKey = (o: AtRiskOrder) => `${storeId}:${o.id}`;
    const lineResolved = (o: AtRiskOrder, i: number) => {
      const l = o.lines[i];
      if (l.fixedBy && prepById[l.fixedBy]) return prepDone(prepById[l.fixedBy]);
      if (l.substitute) return !!contactedOrders[orderKey(o)];
      return false;
    };
    const orderResolved = (o: AtRiskOrder) => o.lines.every((_, i) => lineResolved(o, i));
    const openOrders = (s: Slot) => s.atRisk.filter((o) => !orderResolved(o));
    const atRiskTotal = d.slots.reduce((n, s) => n + openOrders(s).length, 0);
    return { data, day: d, actions, prepDone, prepById, orderKey, lineResolved, orderResolved, openOrders, atRiskTotal };
  }, [data, d, actions, contactedOrders, storeId]);
}
