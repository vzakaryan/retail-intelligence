import { useDemo } from "@/app/DemoContext";
import { useTaskActions } from "@/app/useTaskActions";
import type { StockStep } from "@/data/stockouts";
import { stepRef } from "@/pages/stockouts/shared";

/** Whether a row's suggested steps are on today's list, and whether they're all done. */
export function useStepStatus() {
  const { store } = useDemo();
  const actions = useTaskActions(store.id);
  return (steps: StockStep[]) => {
    const tasks = steps.map(stepRef).filter(Boolean).map((r) => actions.find(r!)).filter(Boolean);
    return { onList: tasks.length > 0, allDone: tasks.length > 0 && tasks.every((x) => x!.done), anyDone: tasks.some((x) => x!.done) };
  };
}
