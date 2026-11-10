import { Banknote, CircleCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DayKpis, Period } from "@/data/today";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { fmtAmd, fmtDeltaPct, fmtDeltaPp, fmtPercent } from "@/lib/format";

export function TodayKpis({ kpis, period }: { kpis: DayKpis; period: Period }) {
  const { t } = useTranslation();
  const vs = t(`today.vs.${period}`);
  const { availability: a, onlineComplete: o, lostSales: l, writeOffs: w } = kpis;

  return (
    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={CircleCheck}
        iconTone="good"
        label={t("today.kpi.availability")}
        info={t("today.kpi.availabilityInfo")}
        value={fmtPercent(a.value)}
        delta={{ text: fmtDeltaPp(a.delta), tone: deltaTone(a.delta, true) }}
        foot={vs}
      />
      <KpiCard
        icon={ShoppingBag}
        iconTone="info"
        label={t("today.kpi.online")}
        info={t("today.kpi.onlineInfo")}
        value={fmtPercent(o.value)}
        delta={{ text: fmtDeltaPp(o.delta), tone: deltaTone(o.delta, true) }}
        foot={t("today.kpi.onlineFoot", { done: o.done, total: o.total })}
      />
      <KpiCard
        icon={Banknote}
        iconTone="bad"
        label={t("today.kpi.lostSales")}
        info={t("today.kpi.lostSalesInfo")}
        value={fmtAmd(l.value)}
        delta={{ text: fmtDeltaPct(l.delta), tone: deltaTone(l.delta, false) }}
        foot={vs}
      />
      <KpiCard
        icon={Trash2}
        iconTone="warn"
        label={t("today.kpi.writeOffs")}
        info={t("today.kpi.writeOffsInfo")}
        value={fmtAmd(w.value)}
        delta={{ text: fmtDeltaPct(w.delta), tone: deltaTone(w.delta, false) }}
        foot={vs}
      />
    </section>
  );
}
