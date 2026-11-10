import { useTranslation } from "react-i18next";
import type { PrepItem } from "@/data/online";
import { useParamText } from "@/pages/stockouts/shared";

/** Short "what to do" text for a prepare-before-picking item. */
export function usePrepText() {
  const { t } = useTranslation();
  const params = useParamText();
  return (p: PrepItem) => t(`online.prep.do.${p.task.kind}`, { ...params(p.task.params), supplier: params({ supplier: p.task.supplierId ?? "" }).supplier });
}
