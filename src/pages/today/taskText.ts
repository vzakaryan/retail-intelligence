import { useTranslation } from "react-i18next";
import type { TaskParam } from "@/data/today";
import type { TaskState } from "@/app/useTasks";
import { getProduct } from "@/data/products";
import { SUPPLIERS } from "@/data/world";
import { fmtDate } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";

/** Builds the localized title and detail line for a task. */
export function useTaskText() {
  const { t } = useTranslation();
  const loc = useLocalized();

  return (task: TaskState): { title: string; detail: string } => {
    const vars: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(task.params)) vars[k] = formatParam(v);
    if (task.productId) vars.product = loc(getProduct(task.productId).name);
    if (task.supplierId) vars.supplier = SUPPLIERS.find((s) => s.id === task.supplierId)?.name ?? "";

    const title = t(`today.task.${task.kind}.title`, vars);
    let detail: string;
    if (task.doneNow) detail = t(`today.tasks.${task.doneNow}Now`);
    else if (task.done && task.doneAt) detail = t(`today.task.${task.kind}.doneDetail`, { ...vars, at: task.doneAt });
    else detail = t(`today.task.${task.kind}.detail`, vars);
    return { title, detail };
  };
}

function formatParam(v: TaskParam): string | number {
  return v instanceof Date ? fmtDate(v, { weekday: "short", month: "short", day: "numeric" }) : v;
}
