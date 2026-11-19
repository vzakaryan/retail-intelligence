import { useState } from "react";
import { Link } from "react-router";
import { Boxes, CalendarClock, ChevronDown, ChevronRight, ChevronUp, PackageCheck, PieChart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { getImpact } from "@/data/impact";
import { daysOfStock, extraValue, getOverstock, type OverRow } from "@/data/overstock";
import { getProduct, type Product } from "@/data/products";
import { BeforeAfterChart } from "@/components/ui/BeforeAfterChart";
import { Card } from "@/components/ui/Card";
import { Dropdown } from "@/components/ui/Dropdown";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { fmtAmd, fmtDeltaPct, fmtDeltaPp, fmtNumber, fmtPercent, fmtPp, fmtSignedPct } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { useParamText } from "@/pages/stockouts/shared";
import { OverstockDrawer, overTone } from "./OverstockDrawer";
import { useStepStatus } from "./useStepStatus";
import { supplierName } from "@/lib/names";

type Category = Product["category"];
type Filter = "all" | Category;
const VISIBLE = 6;
const th = "whitespace-nowrap border-b border-line bg-subtle px-4 py-2.5 text-left text-xs font-semibold text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-3 align-middle first:pl-5 last:pr-5";

/** Value of extra stock a row's steps clear once they're done (moved units, or all of it). */
function clearedValue(row: OverRow): number {
  const p = getProduct(row.productId);
  const moved = row.steps.find((s) => s.kind === "add" && typeof s.task.params.qty === "number");
  const qty = moved && moved.kind === "add" ? Number(moved.task.params.qty) : row.extraUnits;
  return Math.min(row.extraUnits, qty) * p.price;
}

/** docs/design-references/approved/11-overstock.png, reworked in step 18 */
export function OverstockPage() {
  const { t } = useTranslation();
  const { store } = useDemo();
  const status = useStepStatus();
  const data = getOverstock(store.id);
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<string>();

  const cat = (r: OverRow) => getProduct(r.productId).category;
  const sorted = [...data.rows].sort((a, b) => extraValue(b) - extraValue(a));
  const filtered = sorted.filter((r) => filter === "all" || cat(r) === filter);
  const shown = expanded ? filtered : filtered.slice(0, VISIBLE);
  const sum = (rows: OverRow[]) => rows.reduce((s, r) => s + extraValue(r), 0);

  // Categories that have extra stock, largest first
  const cats = (Object.keys(data.stockValue) as Category[])
    .map((key) => ({ key, rows: sorted.filter((r) => cat(r) === key) }))
    .filter((c) => c.rows.length)
    .map((c) => ({ ...c, extra: sum(c.rows) }))
    .sort((a, b) => b.extra - a.extra);

  const total = sum(data.rows);
  const extra = sum(filtered);
  const part = total ? extra / total : 0;
  const expiring = sum(filtered.filter((r) => r.expiringSoon));
  // Week-on-week change: the store's extra stock trend, applied to the selection
  const v = data.trend.values;
  const prevExtra = extra * (v[v.length - 2] / v[v.length - 1]);
  const stock = filter === "all" ? Object.values(data.stockValue).reduce((a, b) => a + b, 0) : data.stockValue[filter];
  const share = (extra / stock) * 100;
  const shareDelta = Math.round((share - (prevExtra / stock) * 100) * 10) / 10;
  // Cleared this week: before the demo + rows with a step completed during it (live)
  const clearedLive = filtered.filter((r) => status(r.steps).anyDone).reduce((s, r) => s + clearedValue(r), 0);
  const cleared = Math.round(data.cleared.week * part) + clearedLive;
  const clearedLast = Math.round(data.cleared.lastWeek * part);
  const clearedDelta = clearedLast ? Math.round(((cleared - clearedLast) / clearedLast) * 1000) / 10 : 0;
  const trend = [...v.slice(0, -1), total];

  const pickFilter = (f: Filter) => {
    setFilter(f);
    setExpanded(false);
  };

  return (
    <>
      <PageHeader
        title={t("pages.overstock.title")}
        subtitle={t("overstock.subtitle")}
        actions={
          <Dropdown
            label={t("overstock.filter")}
            value={filter}
            onChange={pickFilter}
            separateFirst
            options={[{ value: "all" as Filter, label: t("overstock.cat.all") }, ...cats.map((c) => ({ value: c.key as Filter, label: t(`overstock.cat.${c.key}`) }))]}
          />
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard icon={Boxes} iconTone="warn" label={t("overstock.kpi.extra")} info={t("overstock.kpi.extraInfo")} value={fmtAmd(extra)} delta={{ text: fmtDeltaPct(data.extraDeltaPct, 0), tone: deltaTone(data.extraDeltaPct, false) }} foot={t("today.vs.week")} />
        <KpiCard
          icon={PieChart}
          iconTone="info"
          label={t("overstock.kpi.share")}
          info={t("overstock.kpi.shareInfo")}
          value={fmtPercent(share)}
          sub={t("overstock.kpi.shareSub", { extra: fmtAmd(extra), stock: fmtAmd(stock) })}
          delta={{ text: fmtDeltaPp(shareDelta), tone: deltaTone(shareDelta, false) }}
          foot={t("today.vs.week")}
        />
        <KpiCard
          icon={PackageCheck}
          iconTone="good"
          label={t("overstock.kpi.cleared")}
          info={t("overstock.kpi.clearedInfo")}
          value={fmtAmd(cleared, { thousands: true })}
          delta={{ text: fmtDeltaPct(clearedDelta), tone: deltaTone(clearedDelta, true) }}
          foot={t("today.vs.week")}
        />
        <KpiCard
          icon={CalendarClock}
          iconTone="bad"
          label={t("overstock.kpi.expiring")}
          info={t("overstock.kpi.expiringInfo")}
          value={fmtAmd(expiring, { thousands: true })}
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
          <div className="flex items-start justify-between gap-3 px-5 pt-[18px]">
            <div>
              <div className="text-base font-semibold">{t("overstock.cats.title")}</div>
              <div className="mt-0.5 text-[13px] text-muted">{t("overstock.cats.subtitle")}</div>
            </div>
            {filter !== "all" && (
              <button className="shrink-0 text-[13px] font-semibold text-primary hover:underline" onClick={() => pickFilter("all")}>
                {t("overstock.cats.showAll")}
              </button>
            )}
          </div>
          <ul className="px-3 pb-3 pt-2">
            {cats.map((c) => {
              const on = filter === c.key;
              const dim = filter !== "all" && !on;
              return (
                <li key={c.key}>
                  <button
                    onClick={() => pickFilter(on ? "all" : c.key)}
                    aria-pressed={on}
                    className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2.5 text-left transition-colors ${on ? "bg-primary-50" : "hover:bg-subtle"} ${dim ? "opacity-50" : ""}`}
                  >
                    <span className="font-medium">{t(`overstock.cat.${c.key}`)}</span>
                    <span className="whitespace-nowrap text-right font-semibold tabular-nums">
                      {fmtAmd(c.extra, { thousands: true })} <span className="font-normal text-muted">· {t("overstock.cats.products", { count: c.rows.length })}</span>
                    </span>
                    <span className="col-span-2 h-2.5 rounded-full bg-[#eeeef4]">
                      <span className="block h-full rounded-full bg-[#e09b2d]" style={{ width: `${(c.extra / cats[0].extra) * 100}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
        <BeforeAfterChart
          title={t("overstock.trend.title")}
          subtitle={t("overstock.trend.subtitle")}
          values={trend}
          before={data.trend.before}
          firstWeek={new Date(2026, 7, 17)}
          format={(v) => fmtNumber(v / 1e6, 2)}
          footer={<SameSales storeId={store.id} />}
        />
      </section>

      <OverstockDrawer row={data.rows.find((r) => r.productId === open)} onClose={() => setOpen(undefined)} />
    </>
  );
}

/** "Less stock, same sales": extra stock went down while availability and sales held up (whole store). */
function SameSales({ storeId }: { storeId: string }) {
  const { t } = useTranslation();
  const im = getImpact(storeId);
  const pct = (b: number, n: number) => Math.round(((n - b) / b) * 100);
  const rows: { label: string; before: string; now: string; change: string; good: boolean }[] = [
    { label: t("overstock.same.extra"), before: fmtAmd(im.excess.before), now: fmtAmd(im.excess.now), change: fmtSignedPct(pct(im.excess.before, im.excess.now)), good: im.excess.now <= im.excess.before },
    { label: t("overstock.same.oos"), before: fmtPercent(im.oosRate.before), now: fmtPercent(im.oosRate.now), change: fmtPp(im.oosRate.now - im.oosRate.before), good: im.oosRate.now <= im.oosRate.before },
    { label: t("overstock.same.sales"), before: fmtAmd(im.netSales.before), now: fmtAmd(im.netSales.now), change: fmtSignedPct(pct(im.netSales.before, im.netSales.now)), good: im.netSales.now >= im.netSales.before },
  ];
  return (
    <div className="border-t border-line px-5 pb-4 pt-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <div className="font-semibold">{t("overstock.same.title")}</div>
        <div className="text-xs text-muted">{t("overstock.same.subtitle")}</div>
      </div>
      <table className="mt-2 w-full text-[13px]">
        <thead>
          <tr className="text-xs text-muted">
            <th className="py-1 text-left font-medium" />
            <th className="px-2 py-1 text-right font-medium">{t("today.results.before")}</th>
            <th className="px-2 py-1 text-right font-medium">{t("today.results.now")}</th>
            <th className="py-1 text-right font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-line">
              <td className="py-2 font-medium">{r.label}</td>
              <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-muted">{r.before}</td>
              <td className="whitespace-nowrap px-2 py-2 text-right font-semibold tabular-nums">{r.now}</td>
              <td className="py-2 text-right">
                <Pill tone={r.good ? "good" : "bad"}>{r.change}</Pill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
