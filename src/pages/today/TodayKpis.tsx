import type { ReactNode } from "react";
import { Banknote, Boxes, PackageX, Receipt, ShoppingBag, ShoppingBasket, Trash2, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DayKpis, Period } from "@/data/today";
import { excessKpi } from "@/data/impact";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { fmtAmd, fmtAmdFull, fmtDeltaPct, fmtDeltaPp, fmtNumber, fmtPercent } from "@/lib/format";

const pctChange = (now: number, prev: number) => Math.round(((now - prev) / prev) * 1000) / 10;
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Key numbers: two labelled rows of 4 — Sales and Stock. */
export function TodayKpis({ storeId, kpis, period }: { storeId: string; kpis: DayKpis; period: Period }) {
  const { t } = useTranslation();
  const vs = t(`today.vs.${period}`);
  const { now, prev } = kpis.sales;
  const basket = now.netSales / now.receipts;
  const basketPrev = prev.netSales / prev.receipts;
  const share = (now.onlineSales / now.netSales) * 100;
  const sharePrev = (prev.onlineSales / prev.netSales) * 100;
  const oos = round1(100 - kpis.availability.value);
  const excess = excessKpi(storeId, period === "week" ? 1 : 4);

  const pct = (n: number, p: number) => {
    const d = pctChange(n, p);
    return { text: fmtDeltaPct(d), tone: deltaTone(d, true) };
  };

  return (
    <>
      <KpiGroup title={t("today.kpi.group.sales")}>
        <KpiCard icon={Banknote} iconTone="primary" label={t("today.kpi.netSales")} info={t("today.kpi.netSalesInfo")} value={fmtAmd(now.netSales)} delta={pct(now.netSales, prev.netSales)} foot={vs} />
        <KpiCard icon={ShoppingBasket} iconTone="primary" label={t("today.kpi.basket")} info={t("today.kpi.basketInfo")} value={fmtAmdFull(Math.round(basket / 10) * 10)} delta={pct(basket, basketPrev)} foot={vs} />
        <KpiCard icon={Receipt} iconTone="primary" label={t("today.kpi.receipts")} info={t("today.kpi.receiptsInfo")} value={fmtNumber(now.receipts)} delta={pct(now.receipts, prev.receipts)} foot={vs} />
        <KpiCard
          icon={ShoppingBag}
          iconTone="info"
          label={t("today.kpi.onlineShare")}
          info={t("today.kpi.onlineShareInfo")}
          value={fmtPercent(share)}
          sub={t("today.kpi.onlineShareSub", { amount: fmtAmd(now.onlineSales) })}
          delta={{ text: fmtDeltaPp(round1(share - sharePrev)), tone: deltaTone(round1(share - sharePrev), true) }}
          foot={vs}
          to="/online-orders"
        />
      </KpiGroup>

      <KpiGroup title={t("today.kpi.group.stock")}>
        <KpiCard
          icon={PackageX}
          iconTone="bad"
          label={t("today.kpi.oosRate")}
          info={t("today.kpi.oosRateInfo")}
          value={fmtPercent(oos)}
          delta={{ text: fmtDeltaPp(-kpis.availability.delta), tone: deltaTone(-kpis.availability.delta, false) }}
          foot={vs}
          to="/stockouts"
        />
        <KpiCard
          icon={TrendingDown}
          iconTone="bad"
          label={t("today.kpi.lostSales")}
          info={t("today.kpi.lostSalesInfo")}
          value={fmtAmd(kpis.lostSales.value)}
          delta={{ text: fmtDeltaPct(kpis.lostSales.delta), tone: deltaTone(kpis.lostSales.delta, false) }}
          foot={vs}
          to="/stockouts"
        />
        <KpiCard
          icon={Boxes}
          iconTone="warn"
          label={t("today.kpi.excess")}
          info={t("today.kpi.excessInfo")}
          value={fmtAmd(excess.value)}
          sub={t("today.kpi.excessSub", { days: fmtNumber(excess.days, 1), target: fmtNumber(excess.target) })}
          delta={{ text: fmtDeltaPct(excess.delta), tone: deltaTone(excess.delta, false) }}
          foot={t(`today.vsAgo.${period}`)}
          to="/overstock"
        />
        <KpiCard
          icon={Trash2}
          iconTone="warn"
          label={t("today.kpi.writeOffs")}
          info={t("today.kpi.writeOffsInfo")}
          value={fmtAmd(kpis.writeOffs.value)}
          delta={{ text: fmtDeltaPct(kpis.writeOffs.delta), tone: deltaTone(kpis.writeOffs.delta, false) }}
          foot={vs}
          to="/write-offs"
        />
      </KpiGroup>
    </>
  );
}

function KpiGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink-2">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{children}</div>
    </section>
  );
}
