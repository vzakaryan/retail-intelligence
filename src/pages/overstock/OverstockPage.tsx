import { useState } from "react";
import { Link } from "react-router";
import { Boxes, CalendarClock, CalendarRange, ChevronDown, ChevronRight, ChevronUp, PackagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { daysOfStock, extraValue, getOverstock, type OverRow } from "@/data/overstock";
import { getProduct, type Product } from "@/data/products";
import { BeforeAfterChart } from "@/components/ui/BeforeAfterChart";
import { Card } from "@/components/ui/Card";
import { HBar } from "@/components/ui/HBar";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { Segmented } from "@/components/ui/Segmented";
import { fmtAmd, fmtDeltaPct, fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { useParamText } from "@/pages/stockouts/shared";
import { OverstockDrawer, overTone } from "./OverstockDrawer";
import { useStepStatus } from "./useStepStatus";
import { supplierName } from "@/lib/names";

type Filter = "all" | "dairy" | "frozen" | "dry";
const VISIBLE = 6;
const th = "whitespace-nowrap border-b border-line bg-subtle px-4 py-2.5 text-left text-xs font-semibold text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-3 align-middle first:pl-5 last:pr-5";
const CAT_COLOR = (days: number, target: number) => (days / target >= 1.8 ? "#d63b3b" : days > target ? "#e09b2d" : "#138a4b");

/** docs/design-references/approved/11-overstock.png */
export function OverstockPage() {
  const { t } = useTranslation();
  const { store } = useDemo();
  const data = getOverstock(store.id);
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<string>();

  const sorted = [...data.rows].sort((a, b) => extraValue(b) - extraValue(a));
  const filtered = sorted.filter((r) => filter === "all" || getProduct(r.productId).category === filter);
  const shown = expanded ? filtered : filtered.slice(0, VISIBLE);
  const total = data.rows.reduce((s, r) => s + extraValue(r), 0);
  const expiring = data.rows.filter((r) => r.expiringSoon).reduce((s, r) => s + extraValue(r), 0);
  const trend = [...data.trend.values.slice(0, -1), total];
  const catMax = Math.max(...data.categories.map((c) => Math.max(c.days, c.target))) * 1.15;

  return (
    <>
      <PageHeader
        title={t("pages.overstock.title")}
        subtitle={t("overstock.subtitle")}
        actions={
          <Segmented
            label={t("overstock.filter")}
            value={filter}
            onChange={(f) => {
              setFilter(f);
              setExpanded(false);
            }}
            options={(["all", "dairy", "frozen", "dry"] as Filter[]).map((f) => ({ value: f, label: t(`overstock.cat.${f}`) }))}
          />
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Boxes} iconTone="warn" label={t("overstock.kpi.extra")} info={t("overstock.kpi.extraInfo")} value={fmtAmd(total)} delta={{ text: fmtDeltaPct(data.extraDeltaPct, 0), tone: deltaTone(data.extraDeltaPct, false) }} foot={t("today.vs.week")} />
        <KpiCard
          icon={CalendarRange}
          iconTone="info"
          label={t("overstock.kpi.days")}
          info={t("overstock.kpi.daysInfo")}
          value={
            <>
              {fmtNumber(data.daysOfStock.value, 1)} <small className="ml-0.5 text-base font-semibold text-ink-2">{t("overstock.kpi.daysUnit")}</small>
            </>
          }
          delta={{ text: `${data.daysOfStock.delta < 0 ? "↓" : "↑"} ${fmtNumber(Math.abs(data.daysOfStock.delta), 1)}`, tone: deltaTone(data.daysOfStock.delta, false) }}
          foot={t("overstock.kpi.target", { count: data.daysOfStock.target })}
        />
        <KpiCard icon={PackagePlus} iconTone="primary" label={t("overstock.kpi.count")} value={fmtNumber(data.rows.length)} delta={{ text: `${data.countDelta < 0 ? "↓" : "↑"} ${Math.abs(data.countDelta)}`, tone: deltaTone(data.countDelta, false) }} foot={t("today.vs.week")} />
        <KpiCard
          icon={CalendarClock}
          iconTone="bad"
          label={t("overstock.kpi.expiring")}
          info={t("overstock.kpi.expiringInfo")}
          value={fmtAmd(expiring)}
          foot={
            <Link to="/write-offs" className="font-semibold text-primary hover:underline">
              {t("overstock.kpi.seeExpiry")}
            </Link>
          }
        />
      </section>

      <Card className="mb-6 overflow-hidden">
        <div className="px-5 pb-3.5 pt-[18px]">
          <div className="text-base font-semibold">{t("overstock.table.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("overstock.table.subtitle")}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t("overstock.table.product")}</th>
                <th className={`${th} text-right`}>{t("overstock.table.inStore")}</th>
                <th className={th}>{t("overstock.table.days")}</th>
                <th className={`${th} text-right`}>{t("overstock.table.extra")}</th>
                <th className={th}>{t("overstock.table.action")}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-0">
              {shown.length ? (
                shown.map((r) => <Row key={r.productId} row={r} active={open === r.productId} onOpen={() => setOpen(r.productId)} />)
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">{t("overstock.table.none")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > VISIBLE && (
          <div className="border-t border-line px-5 py-3.5">
            <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary" onClick={() => setExpanded((e) => !e)}>
              {expanded ? t("stockouts.table.showLess") : t("overstock.table.showMore", { count: filtered.length - VISIBLE })}
              {expanded ? <ChevronUp className="size-[15px]" /> : <ChevronDown className="size-[15px]" />}
            </button>
          </div>
        )}
      </Card>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <div className="px-5 pt-[18px]">
            <div className="text-base font-semibold">{t("overstock.cats.title")}</div>
            <div className="mt-0.5 text-[13px] text-muted">{t("overstock.cats.subtitle")}</div>
          </div>
          <div className="px-5 pb-4 pt-2">
            {data.categories.map((c) => (
              <HBar key={c.key} label={t(`overstock.cat.${c.key as Product["category"]}`)} value={c.days} max={catMax} target={c.target} color={CAT_COLOR(c.days, c.target)} right={t("overstock.days", { count: c.days })} />
            ))}
          </div>
        </Card>
        <BeforeAfterChart title={t("overstock.trend.title")} subtitle={t("overstock.trend.subtitle")} values={trend} before={data.trend.before} firstWeek={new Date(2026, 7, 17)} format={(v) => fmtNumber(v / 1e6, 2)} />
      </section>

      <OverstockDrawer row={data.rows.find((r) => r.productId === open)} onClose={() => setOpen(undefined)} />
    </>
  );
}

function Row({ row, active, onOpen }: { row: OverRow; active: boolean; onOpen: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const params = useParamText();
  const status = useStepStatus()(row.steps);
  const p = getProduct(row.productId);
  const meta = status.allDone ? t("stockouts.table.stepsDone") : status.onList ? t("stockouts.table.onList") : row.actionMeta ? t(`overstock.meta.${row.actionMeta.key}`, params(row.actionMeta.params)) : "";
  return (
    <tr className={`cursor-pointer ${active ? "bg-primary-50" : status.allDone ? "bg-good-bg/40" : "hover:bg-subtle"}`} onClick={onOpen}>
      <td className={td}>
        <div className="flex items-center gap-3">
          <ProductThumb emoji={p.emoji} />
          <div>
            <div className="whitespace-nowrap font-semibold">{loc(p.name)}</div>
            <div className="text-xs text-muted">{supplierName(p.supplierId)}</div>
          </div>
        </div>
      </td>
      <td className={`${td} text-right tabular-nums`}>{fmtNumber(row.inStore)}</td>
      <td className={td}>
        <span className="whitespace-nowrap">
          <Pill tone={overTone(row)}>{t("overstock.days", { count: daysOfStock(row) })}</Pill> <span className="text-xs text-muted">{t("overstock.table.target", { count: row.target })}</span>
        </span>
      </td>
      <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{fmtAmd(extraValue(row), { thousands: true })}</td>
      <td className={td}>
        <div className={`font-medium ${status.allDone ? "text-good" : ""}`}>{t(`overstock.action.${row.action.key}`, params(row.action.params))}</div>
        {meta && <div className={`text-xs ${status.allDone ? "text-good" : "text-muted"}`}>{meta}</div>}
      </td>
      <td className={`${td} w-8`}>
        <ChevronRight className="size-[18px] text-faint" />
      </td>
    </tr>
  );
}
