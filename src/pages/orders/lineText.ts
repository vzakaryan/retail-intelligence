import { useTranslation } from "react-i18next";
import type { LineView } from "@/app/useOrders";
import { fmtNumber } from "@/lib/format";

/** Short reason under a suggested quantity, e.g. "Weekend demand +20%". */
export function useReasonText() {
  const { t } = useTranslation();
  return (l: LineView) => (l.extraSafety ? t("orders.reason.extraSafety") : t(`orders.reason.${l.line.reason.key}`, { pct: l.line.reason.pct ?? 0 }));
}

/** Status label for a reviewed line. */
export function useStatusText() {
  const { t } = useTranslation();
  return (l: LineView): { label: string; tone: "good" | "warn" | "neutral"; note?: string } => {
    const r = l.review!;
    if (r.status === "notNeeded") return { label: t("orders.status.notNeeded"), tone: "neutral" };
    if (r.status === "changed") {
      const diff = r.qty - l.suggested;
      return {
        label: t("orders.status.changed", { diff: `${diff > 0 ? "+" : "−"}${fmtNumber(Math.abs(diff))}` }),
        tone: "warn",
        note: r.reason ? t("orders.status.reasonNote", { reason: t(`orders.changeReason.${r.reason}`).toLowerCase() }) : undefined,
      };
    }
    return { label: t("orders.status.accepted"), tone: "good" };
  };
}
