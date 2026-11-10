import { useDemo } from "@/app/DemoContext";
import { useTaskActions } from "@/app/useTaskActions";
import type { UpcomingPromo } from "@/data/promotions";
import { stepRef } from "@/pages/stockouts/shared";

/** How many get-ready steps are done. Extra units already in an order suggestion count as done. */
export function usePromoReadiness() {
  const { store } = useDemo();
  const actions = useTaskActions(store.id);
  return (p: UpcomingPromo) => {
    const steps = p.steps.filter((s) => s.kind !== "note");
    const done = steps.filter((s) => {
      if (s.kind === "orderExtra" || s.kind === "order" || s.kind === "orderLess") return true;
      const ref = stepRef(s);
      return !!ref && !!actions.find(ref)?.done;
    }).length;
    return { done, total: steps.length };
  };
}
