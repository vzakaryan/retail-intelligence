import { useTranslation } from "react-i18next";
import type { StoreStockouts } from "@/data/stockouts";
import { BeforeAfterChart } from "@/components/ui/BeforeAfterChart";
import { fmtPercent } from "@/lib/format";

/** Weekly out-of-stock rate, before vs. with Retail Intelligence. */
export function TrendCard({ trend }: { trend: StoreStockouts["trend"] }) {
  const { t } = useTranslation();
  return (
    <BeforeAfterChart
      title={t("stockouts.trend.title")}
      subtitle={t("stockouts.trend.subtitle")}
      values={trend.values}
      before={trend.before}
      firstWeek={trend.weeks[0]}
      format={(v) => fmtPercent(v)}
    />
  );
}
