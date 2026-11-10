import { useTranslation } from "react-i18next";
import type { TaskRef } from "@/app/useTaskActions";
import type { StockRow, StockStep } from "@/data/stockouts";
import type { TaskParam } from "@/data/today";
import { STORES } from "@/data/world";
import { fmtDate } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { supplierName } from "@/lib/names";

/** The task behind a suggested step, if the step is something you do (not "covered by an order"). */
export function stepRef(step: StockStep): TaskRef | undefined {
  switch (step.kind) {
    case "existing":
      return { task: step.fallback, linked: { kind: step.taskKind, productId: step.productId } };
    case "call":
      return {
        task: { kind: "callSupplier", supplierId: step.supplierId, params: { due: step.params.due, days: 2 }, tag: "supplier" },
        linked: { kind: "callSupplier", supplierId: step.supplierId },
      };
    case "add":
      return { task: step.task };
    default:
      return undefined;
  }
}

/** Turns data params (supplier / store ids, dates) into display text. */
export function useParamText() {
  const loc = useLocalized();
  return (params: Record<string, TaskParam> = {}) => {
    const out: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v instanceof Date) out[k] = k === "day" ? fmtDate(v, { weekday: "long" }) : fmtDate(v, { weekday: "short", month: "short", day: "numeric" });
      else if (k === "supplier") out[k] = supplierName(String(v));
      else if (k === "store") out[k] = loc(STORES.find((s) => s.id === v)?.name ?? { en: String(v) });
      else out[k] = v;
    }
    return out;
  };
}

/** "around 11:00" or "Wed morning" */
export function useRunsOutText() {
  const { t } = useTranslation();
  return (row: StockRow) =>
    "time" in row.runsOut
      ? t("stockouts.runsOut.around", { time: row.runsOut.time })
      : t("stockouts.runsOut.dayPart", { day: fmtDate(row.runsOut.day, { weekday: "short" }), part: t(`stockouts.runsOut.${row.runsOut.part}`) });
}
