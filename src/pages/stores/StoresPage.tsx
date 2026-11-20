import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDown, ArrowUp, Banknote, ChevronRight, FileSpreadsheet, ListChecks, PackageX, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import type { Store } from "@/data/types";
import { chainAverage, chainSummary, compareTone, storeRows, type Metric, type StoreRow } from "@/data/storeCompare";
import { getDistrict } from "@/data/world";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { StoreBadge } from "@/components/ui/StoreBadge";
import { fmtAmd, fmtDate, fmtDeltaPct, fmtDeltaPp, fmtPercent, fmtSignedPct } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { useStoreLabel } from "@/lib/useStoreLabel";
import { pick } from "@/lib/names";
import { AdoptionChart } from "./AdoptionChart";
import { DistrictMap } from "./DistrictMap";
import { useMetricFormat } from "./metricFormat";

const COLUMNS: Metric[] = ["salesGrowth", "oos", "writeOffsPct", "extraPct", "actedOn"];

/** Head office: compare stores and their managers, and the value the platform brought (step 21). */
export function StoresPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const label = useStoreLabel();
  const navigate = useNavigate();
  const fmt = useMetricFormat();
  const { setStoreId } = useDemo();
  const [district, setDistrict] = useState<string>();
  const [sort, setSort] = useState<{ key: Metric; asc: boolean }>({ key: "impactPerWeek", asc: false });

  const all = storeRows();
  const chain = chainSummary();
  const avgs = useMemo(() => Object.fromEntries(([...COLUMNS, "impactPerWeek"] as Metric[]).map((m) => [m, chainAverage(all, m)])) as Record<Metric, number>, [all]);
  const rows = useMemo(() => {
    const list = all.filter((r) => !district || r.store.districtId === district);
    return [...list].sort((a, b) => (a[sort.key] - b[sort.key]) * (sort.asc ? 1 : -1));
  }, [all, district, sort]);

  const openStore = (s: Store) => {
    setStoreId(s.id);
    navigate("/today");
  };
  // First click sorts best first
  const toggleSort = (key: Metric) =>
    setSort((cur) => (cur.key === key ? { key, asc: !cur.asc } : { key, asc: key === "oos" || key === "writeOffsPct" || key === "extraPct" }));

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const head = [t("stores.table.number"), t("stores.table.store"), t("stores.table.district"), t("stores.table.manager"), ...COLUMNS.map((m) => t(`stores.col.${m}`)), t("stores.col.impact"), t("stores.col.impactPerWeek")];
    const body = rows.map((r) => [r.store.number, label.name(r.store), label.district(r.store), pick(r.store.manager.name), ...COLUMNS.map((m) => r[m]), r.impact, r.impactPerWeek]);
    const csv = "﻿" + [head, ...body].map((x) => x.map(esc).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "stores-comparison-last-4-weeks.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const th = "border-b border-line bg-subtle px-3 py-2.5 text-left align-bottom text-xs font-semibold leading-snug text-muted first:pl-5 last:pr-5";
  const td = "border-b border-line px-3 py-[10px] align-middle first:pl-5 last:pr-5";
  const SortTh = ({ k: key, children }: { k: Metric; children: string }) => (
    <th className={`${th} text-right`} aria-sort={sort.key === key ? (sort.asc ? "ascending" : "descending") : "none"}>
      <button className={`inline-flex items-center justify-end gap-1 text-right hover:text-ink ${sort.key === key ? "text-ink" : ""}`} onClick={() => toggleSort(key)}>
        {children}
        {sort.key === key && (sort.asc ? <ArrowUp className="size-3 shrink-0" /> : <ArrowDown className="size-3 shrink-0" />)}
      </button>
    </th>
  );
  const oosDelta = Math.round((chain.oos.now - chain.oos.before) * 10) / 10;

  return (
    <>
      <PageHeader
        title={t("pages.stores.title")}
        subtitle={t("stores.subtitleCompare")}
        actions={<span className="rounded-ctl border border-line bg-white px-3 py-2 font-medium text-ink-2">{t("stores.period")}</span>}
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard icon={Banknote} iconTone="primary" label={t("stores.kpi.netSales")} info={t("stores.kpi.netSalesInfo")} value={fmtAmd(chain.netSales4w)} delta={{ text: fmtDeltaPct(chain.salesGrowth), tone: deltaTone(chain.salesGrowth, true) }} foot={t("today.vs.4w")} />
        <KpiCard
          icon={PackageX}
          iconTone="bad"
          label={t("stores.kpi.oos")}
          info={t("stores.kpi.oosInfo")}
          value={fmtPercent(chain.oos.now)}
          sub={t("stores.kpi.oosSub", { before: fmtPercent(chain.oos.before) })}
          delta={{ text: fmtDeltaPp(oosDelta), tone: deltaTone(oosDelta, false) }}
          foot={t("stores.kpi.vsBefore")}
        />
        <KpiCard
          icon={ListChecks}
          iconTone="info"
          label={t("stores.kpi.actedOn")}
          info={t("stores.kpi.actedOnInfo")}
          value={fmtPercent(chain.actedOn, 0)}
          sub={t("stores.kpi.lowAdoption", { count: chain.lowAdoption })}
        />
        <KpiCard
          icon={Sparkles}
          iconTone="good"
          label={t("stores.kpi.value")}
          info={t("stores.kpi.valueInfo")}
          value={fmtAmd(chain.value)}
          sub={t("stores.kpi.valueSub", { date: fmtDate(chain.firstGoLive, { month: "short", day: "numeric" }), count: all.length })}
        />
      </section>

      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3.5 pt-[18px]">
          <div>
            <div className="text-base font-semibold">{district ? t("stores.table.titleDistrict", { district: loc(getDistrict(district).name) }) : t("stores.compare.title")}</div>
            <div className="mt-0.5 text-[13px] text-muted">{t("stores.compare.subtitle")}</div>
          </div>
          <div className="flex items-center gap-2">
            {district && (
              <Button onClick={() => setDistrict(undefined)}>{t("stores.map.clear")}</Button>
            )}
            <Button onClick={exportCsv}>
              <FileSpreadsheet />
              {t("stores.table.export")}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t("stores.compare.store")}</th>
                {COLUMNS.map((m) => (
                  <SortTh key={m} k={m}>
                    {t(`stores.col.${m}`)}
                  </SortTh>
                ))}
                <SortTh k="impactPerWeek">{t("stores.col.impact")}</SortTh>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-0">
              {rows.map((r) => (
                <Row key={r.store.id} r={r} avgs={avgs} td={td} onOpen={() => openStore(r.store)} />
              ))}
              <tr className="bg-subtle text-[13px] text-muted">
                <td className={`${td} font-semibold`}>{t("stores.compare.average")}</td>
                {COLUMNS.map((m) => (
                  <td key={m} className={`${td} text-right tabular-nums`}>
                    {fmt(m, avgs[m])}
                  </td>
                ))}
                <td className={`${td} text-right tabular-nums`}>{t("stores.compare.perWeek", { amount: fmt("impactPerWeek", avgs.impactPerWeek) })}</td>
                <td className={td} />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-5 py-3 text-xs text-muted">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-good-bg ring-1 ring-good/40" />{t("stores.compare.legendGood")}</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-bad-bg ring-1 ring-bad/40" />{t("stores.compare.legendBad")}</span>
          <span>{t("stores.compare.legendNote")}</span>
        </div>
      </Card>

      <section className="mb-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <DistrictMap rows={all} selected={district} onSelect={setDistrict} />
        <AdoptionChart rows={all} chain={chain} onOpen={openStore} />
      </section>

      <BeforeNow chain={chain} />
    </>
  );
}

function Row({ r, avgs, td, onOpen }: { r: StoreRow; avgs: Record<Metric, number>; td: string; onOpen: () => void }) {
  const { t } = useTranslation();
  const label = useStoreLabel();
  const fmt = useMetricFormat();
  return (
    <tr className="cursor-pointer hover:bg-subtle" onClick={onOpen}>
      <td className={td}>
        <div className="flex items-center gap-3">
          <StoreBadge number={r.store.number} label={t("common.storeNumber", { number: r.store.number })} />
          <div className="min-w-0">
            <div className="whitespace-nowrap font-semibold">{label.name(r.store)}</div>
            <div className="whitespace-nowrap text-xs text-muted">
              {label.district(r.store)} · {pick(r.store.manager.name)}
            </div>
          </div>
        </div>
      </td>
      {COLUMNS.map((m) => {
        const tone = compareTone(r[m], avgs[m], m);
        return (
          <td key={m} className={`${td} text-right`}>
            {tone === "neutral" ? <span className="tabular-nums">{fmt(m, r[m])}</span> : <Pill tone={tone}>{fmt(m, r[m])}</Pill>}
          </td>
        );
      })}
      <td className={`${td} text-right`}>
        <div className="whitespace-nowrap font-semibold tabular-nums">{fmtAmd(r.impact)}</div>
        <div className={`whitespace-nowrap text-xs ${compareTone(r.impactPerWeek, avgs.impactPerWeek, "impactPerWeek") === "good" ? "text-good" : compareTone(r.impactPerWeek, avgs.impactPerWeek, "impactPerWeek") === "bad" ? "text-bad" : "text-muted"}`}>
          {t("stores.compare.perWeekWeeks", { amount: fmt("impactPerWeek", r.impactPerWeek), count: r.weeks })}
        </div>
      </td>
      <td className={`${td} w-8`}>
        <ChevronRight className="size-[18px] text-faint" aria-label={t("stores.table.open")} />
      </td>
    </tr>
  );
}

/** "What the platform brought": whole chain, before the stores started vs. this week. */
function BeforeNow({ chain }: { chain: ReturnType<typeof chainSummary> }) {
  const { t } = useTranslation();
  const b = chain.beforeNow;
  const pct = (x: { before: number; now: number }) => Math.round(((x.now - x.before) / x.before) * 100);
  const items: { label: string; before: string; now: string; change: string; good: boolean }[] = [
    { label: t("stores.brought.oos"), before: fmtPercent(chain.oos.before), now: fmtPercent(chain.oos.now), change: fmtDeltaPp(chain.oos.now - chain.oos.before), good: chain.oos.now <= chain.oos.before },
    { label: t("stores.brought.lostSales"), before: fmtAmd(b.lostSales.before), now: fmtAmd(b.lostSales.now), change: fmtSignedPct(pct(b.lostSales)), good: b.lostSales.now <= b.lostSales.before },
    { label: t("stores.brought.writeOffs"), before: fmtAmd(b.writeOffs.before), now: fmtAmd(b.writeOffs.now), change: fmtSignedPct(pct(b.writeOffs)), good: b.writeOffs.now <= b.writeOffs.before },
    { label: t("stores.brought.excess"), before: fmtAmd(b.excess.before), now: fmtAmd(b.excess.now), change: fmtSignedPct(pct(b.excess)), good: b.excess.now <= b.excess.before },
    { label: t("stores.brought.netSales"), before: fmtAmd(b.netSales.before), now: fmtAmd(b.netSales.now), change: fmtSignedPct(pct(b.netSales)), good: b.netSales.now >= b.netSales.before },
  ];
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-5 pt-[18px]">
        <div className="text-base font-semibold">{t("stores.brought.title")}</div>
        <div className="text-[13px] text-muted">{t("stores.brought.subtitle")}</div>
      </div>
      <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-3 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((x) => (
          <div key={x.label} className="rounded-xl border border-line px-4 py-3">
            <div className="text-[13px] font-semibold text-ink">{x.label}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="whitespace-nowrap text-xl font-bold tabular-nums">{x.now}</span>
              <Pill tone={x.good ? "good" : "bad"}>{x.change}</Pill>
            </div>
            <div className="mt-1 whitespace-nowrap text-xs text-muted">{t("stores.brought.was", { value: x.before })}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
