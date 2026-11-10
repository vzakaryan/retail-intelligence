import { useState } from "react";
import { Banknote, ChevronDown, ChevronRight, ChevronUp, CircleOff, PackageX, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { useTaskActions } from "@/app/useTaskActions";
import { getProduct } from "@/data/products";
import { getStockouts, type Horizon, type RiskGroup, type StockRow } from "@/data/stockouts";
import { getStoreDay } from "@/data/today";
import { Card } from "@/components/ui/Card";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { Segmented } from "@/components/ui/Segmented";
import { fmtAmd, fmtDeltaPct, fmtDeltaPp, fmtNumber, fmtPercent } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { MissesCard } from "./MissesCard";
import { ProductDrawer } from "./ProductDrawer";
import { TrendCard } from "./TrendCard";
import { stepRef, useParamText, useRunsOutText } from "./shared";
import { supplierName } from "@/lib/names";

const th = "whitespace-nowrap border-b border-line bg-subtle px-4 py-2.5 text-left text-xs font-semibold text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-3 align-middle first:pl-5 last:pr-5";

/** docs/design-references/approved/07-stockout-risk.png */
export function StockoutsPage() {
  const { t } = useTranslation();
  const { store } = useDemo();
  const data = getStockouts(store.id);
  const day = getStoreDay(store.id).kpis.week;
  const [horizon, setHorizon] = useState<Horizon>("3d");
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<string>();

  const inHorizon = data.rows.filter((r) => horizon === "7d" || r.group !== "later");
  const visibleGroups: RiskGroup[] = ["today", "tomorrow"];
  const hidden = inHorizon.filter((r) => !visibleGroups.includes(r.group));
  const shownRows = expanded ? inHorizon : inHorizon.filter((r) => visibleGroups.includes(r.group));
  const groups = (["today", "tomorrow", "soon", "later"] as RiskGroup[]).filter((g) => shownRows.some((r) => r.group === g));
  const oos = 100 - day.availability.value;

  return (
    <>
      <PageHeader
        title={t("pages.stockouts.title")}
        subtitle={t("stockouts.subtitle")}
        actions={
          <Segmented
            label={t("stockouts.horizon.label")}
            value={horizon}
            onChange={(h) => {
              setHorizon(h);
              setExpanded(false);
            }}
            options={[
              { value: "3d", label: t("stockouts.horizon.3d") },
              { value: "7d", label: t("stockouts.horizon.7d") },
            ]}
          />
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={PackageX} iconTone="bad" label={t("stockouts.kpi.atRisk")} info={t("stockouts.kpi.atRiskInfo")} value={fmtNumber(inHorizon.length)} delta={{ text: `${data.atRiskDelta < 0 ? "↓" : "↑"} ${Math.abs(data.atRiskDelta)}`, tone: deltaTone(data.atRiskDelta, false) }} foot={t("today.vs.week")} />
        <KpiCard icon={CircleOff} iconTone="warn" label={t("stockouts.kpi.oos")} info={t("stockouts.kpi.oosInfo")} value={fmtPercent(oos)} delta={{ text: fmtDeltaPp(data.oosDeltaPp), tone: deltaTone(data.oosDeltaPp, false) }} foot={t("today.vs.week")} />
        <KpiCard icon={Banknote} iconTone="bad" label={t("stockouts.kpi.lostSales")} info={t("today.kpi.lostSalesInfo")} value={fmtAmd(day.lostSales.value)} delta={{ text: fmtDeltaPct(day.lostSales.delta), tone: deltaTone(day.lostSales.delta, false) }} foot={t("today.vs.week")} />
        <KpiCard icon={Target} iconTone="primary" label={t("stockouts.kpi.accuracy")} info={t("stockouts.kpi.accuracyInfo")} value={fmtPercent(data.forecastAccuracy.value)} delta={{ text: fmtDeltaPp(data.forecastAccuracy.delta), tone: deltaTone(data.forecastAccuracy.delta, true) }} foot={t("stockouts.kpi.last4w")} />
      </section>

      <Card className="mb-6 overflow-hidden">
        <div className="px-5 pb-3.5 pt-[18px]">
          <div className="text-base font-semibold">{t("stockouts.table.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("stockouts.table.subtitle")}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t("stockouts.table.product")}</th>
                <th className={th}>{t("stockouts.table.runsOut")}</th>
                <th className={`${th} text-right`}>{t("stockouts.table.onShelf")}</th>
                <th className={`${th} text-right`}>{t(`stockouts.table.expected.${horizon}`)}</th>
                <th className={th}>{t("stockouts.table.action")}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <GroupRows key={g} group={g} rows={shownRows.filter((r) => r.group === g)} horizon={horizon} openId={open} onOpen={setOpen} />
              ))}
            </tbody>
          </table>
        </div>
        {hidden.length > 0 && (
          <div className="border-t border-line px-5 py-3.5">
            <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary" onClick={() => setExpanded((e) => !e)}>
              {expanded ? t("stockouts.table.showLess") : t(`stockouts.table.showMore.${horizon}`, { count: hidden.length })}
              {expanded ? <ChevronUp className="size-[15px]" /> : <ChevronDown className="size-[15px]" />}
            </button>
          </div>
        )}
      </Card>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[2fr_1fr]">
        <TrendCard trend={data.trend} />
        <MissesCard data={data} />
      </section>

      <ProductDrawer row={data.rows.find((r) => r.productId === open)} onClose={() => setOpen(undefined)} />
    </>
  );
}

function GroupRows({ group, rows, horizon, openId, onOpen }: { group: RiskGroup; rows: StockRow[]; horizon: Horizon; openId?: string; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <>
      <tr>
        <td colSpan={6} className="border-b border-line bg-subtle px-5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-muted">
          {t(`stockouts.groups.${group}`)}
        </td>
      </tr>
      {rows.map((r) => (
        <RiskRow key={r.productId} row={r} horizon={horizon} active={openId === r.productId} onOpen={() => onOpen(r.productId)} />
      ))}
    </>
  );
}

function RiskRow({ row, horizon, active, onOpen }: { row: StockRow; horizon: Horizon; active: boolean; onOpen: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const params = useParamText();
  const runsOut = useRunsOutText();
  const { store } = useDemo();
  const actions = useTaskActions(store.id);
  const p = getProduct(row.productId);
  const supplier = supplierName(p.supplierId);

  // Status of the suggested steps on today's list
  const tasks = row.steps.map(stepRef).filter(Boolean).map((r) => actions.find(r!)).filter(Boolean);
  const allDone = tasks.length > 0 && tasks.every((x) => x!.done);
  const onList = tasks.length > 0;
  const meta = allDone ? t("stockouts.table.stepsDone") : onList ? t("stockouts.table.onList") : row.actionMeta && row.actionMeta.key !== "taskAdded" ? t(`stockouts.meta.${row.actionMeta.key}`, params(row.actionMeta.params)) : "";

  return (
    <tr className={`cursor-pointer ${active ? "bg-primary-50" : allDone ? "bg-good-bg/40 hover:bg-good-bg/60" : "hover:bg-subtle"}`} onClick={onOpen}>
      <td className={td}>
        <div className="flex items-center gap-3">
          <ProductThumb emoji={p.emoji} />
          <div>
            <div className="whitespace-nowrap font-semibold">{loc(p.name)}</div>
            <div className="whitespace-nowrap text-xs text-muted">
              {supplier}
              {row.delivery?.uncertain && ` · ${t("stockouts.table.deliveryLate")}`}
            </div>
          </div>
        </div>
      </td>
      <td className={td}>
        <Pill tone={row.tone}>{runsOut(row)}</Pill>
      </td>
      <td className={`${td} text-right tabular-nums`}>
        <div>{fmtNumber(row.onShelf)}</div>
        {row.backroom > 0 && <div className="whitespace-nowrap text-xs text-muted">{t("stockouts.table.inBackroom", { count: row.backroom })}</div>}
      </td>
      <td className={`${td} text-right tabular-nums`}>{fmtNumber(horizon === "3d" ? row.expected3 : row.expected7)}</td>
      <td className={td}>
        <div className={`font-medium ${allDone ? "text-good" : ""}`}>{t(`stockouts.action.${row.action.key}`, params(row.action.params))}</div>
        {meta && <div className={`text-xs ${allDone ? "text-good" : "text-muted"}`}>{meta}</div>}
      </td>
      <td className={`${td} w-8`}>
        <ChevronRight className="size-[18px] text-faint" />
      </td>
    </tr>
  );
}
