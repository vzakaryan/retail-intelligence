import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DayKpis, Period } from "@/data/today";
import { deltaTone } from "@/components/ui/KpiCard";
import { TONE } from "@/components/ui/tone";
import { fmtAmd, fmtDeltaPct, fmtDeltaPp, fmtNumber, fmtPercent } from "@/lib/format";
import { useOnlineState } from "@/pages/online/useOnlineState";

/** Key online-order numbers; the whole card opens the Online orders page. */
export function OnlineOrdersCard({ storeId, kpis, period }: { storeId: string; kpis: DayKpis; period: Period }) {
  const { t } = useTranslation();
  const st = useOnlineState(storeId, "today");
  const vs = t(`today.vs.${period}`);
  const complete = kpis.onlineComplete;
  const { now, prev } = kpis.sales;
  const salesDelta = Math.round(((now.onlineSales - prev.onlineSales) / prev.onlineSales) * 1000) / 10;

  return (
    <Link
      to="/online-orders"
      className="group block rounded-card border border-line bg-white transition-colors hover:border-primary/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-[18px]">
        <div>
          <div className="text-base font-semibold">{t("today.online.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("today.online.subtitleKpis")}</div>
        </div>
        <ArrowRight className="mt-0.5 size-[18px] shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden px-5 pb-4 pt-3">
        <Stat label={t("today.online.orders")} value={fmtNumber(st.day.orders)} note={t("today.online.slots", { count: st.day.slots.length })} />
        <Stat
          label={t("today.online.atRisk")}
          value={<span className={st.atRiskTotal ? "text-bad" : "text-good"}>{fmtNumber(st.atRiskTotal)}</span>}
          note={st.atRiskTotal ? t("today.online.atRiskNote", { time: st.day.pickingStarts }) : t("today.online.allReady")}
        />
        <Stat label={t("today.online.complete")} value={fmtPercent(complete.value)} delta={{ text: fmtDeltaPp(complete.delta), tone: deltaTone(complete.delta, true) }} note={vs} />
        <Stat label={t("today.online.sales")} value={fmtAmd(now.onlineSales)} delta={{ text: fmtDeltaPct(salesDelta), tone: deltaTone(salesDelta, true) }} note={vs} />
      </div>
    </Link>
  );
}

function Stat({ label, value, note, delta }: { label: string; value: ReactNode; note: string; delta?: { text: string; tone: keyof typeof TONE } }) {
  return (
    <div className="border-line py-2.5 pr-3 [&:nth-child(-n+2)]:border-b [&:nth-child(even)]:pl-4 [&:nth-child(odd)]:border-r">
      <div className="text-[13px] font-semibold leading-snug text-ink">{label}</div>
      <div className="mt-1 text-[22px] font-bold leading-tight tracking-tight">{value}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {delta && <span className={`whitespace-nowrap rounded-full px-1.5 py-px font-semibold ${TONE[delta.tone]}`}>{delta.text}</span>}
        {note}
      </div>
    </div>
  );
}
