import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDown, ArrowUp, Banknote, ChevronRight, CircleCheck, FileSpreadsheet, Lightbulb, ListChecks, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import type { Store } from "@/data/types";
import { CHAIN_DELTAS, HIGH_ADOPTION_PCT, STORES, adoptionInsight, chainKpis, getDistrict } from "@/data/world";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { fmtAmd, fmtDeltaPct, fmtDeltaPp, fmtPercent } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { DistrictMap } from "./DistrictMap";
import { availabilityStatus, availabilityTone } from "./tones";

type SortKey = "availability" | "onlineFulfillment" | "lostSales4w" | "suggestionsActedOn";

/** Head-office view — docs/design-references/approved/06-all-stores-yerevan.png */
export function StoresPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const { setStoreId } = useDemo();
  const [district, setDistrict] = useState<string>();
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "availability", asc: true });

  const k = chainKpis();
  const insight = adoptionInsight();
  const rows = useMemo(() => {
    const list = STORES.filter((s) => !district || s.districtId === district);
    return [...list].sort((a, b) => (a.kpis[sort.key] - b.kpis[sort.key]) * (sort.asc ? 1 : -1));
  }, [district, sort]);

  const openStore = (s: Store) => {
    setStoreId(s.id);
    navigate("/today");
  };
  const toggleSort = (key: SortKey) => setSort((cur) => (cur.key === key ? { key, asc: !cur.asc } : { key, asc: key === "availability" || key === "onlineFulfillment" || key === "suggestionsActedOn" }));

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const head = [t("stores.table.store"), t("stores.table.district"), t("stores.table.manager"), t("stores.table.availability"), t("stores.table.online"), t("stores.table.lostSales"), t("stores.table.actedOn")];
    const body = rows.map((s) => [`${s.code} ${loc(s.name)}`, loc(getDistrict(s.districtId).name), s.manager.name, s.kpis.availability, s.kpis.onlineFulfillment, s.kpis.lostSales4w, s.kpis.suggestionsActedOn]);
    const csv = "﻿" + [head, ...body].map((r) => r.map(esc).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "stores-yerevan-last-4-weeks.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const th = "whitespace-nowrap border-b border-line bg-subtle px-3.5 py-2.5 text-left text-xs font-semibold text-muted first:pl-5 last:pr-5";
  const td = "border-b border-line px-3.5 py-[11px] align-middle first:pl-5 last:pr-5";
  const SortTh = ({ k: key, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th className={`${th} ${right ? "text-right" : ""}`} aria-sort={sort.key === key ? (sort.asc ? "ascending" : "descending") : "none"}>
      <button className={`inline-flex items-center gap-1 hover:text-ink ${sort.key === key ? "text-ink" : ""}`} onClick={() => toggleSort(key)}>
        {label}
        {sort.key === key && (sort.asc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </th>
  );

  return (
    <>
      <PageHeader
        title={t("pages.stores.title")}
        subtitle={t("pages.stores.subtitle")}
        actions={<span className="rounded-ctl border border-line bg-white px-3 py-2 font-medium text-ink-2">{t("stores.period")}</span>}
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={CircleCheck} iconTone="good" label={t("stores.kpi.availability")} info={t("today.kpi.availabilityInfo")} value={fmtPercent(k.availability)} delta={{ text: fmtDeltaPp(CHAIN_DELTAS.availabilityPp), tone: deltaTone(CHAIN_DELTAS.availabilityPp, true) }} foot={t("today.vs.4w")} />
        <KpiCard icon={ShoppingBag} iconTone="info" label={t("stores.kpi.online")} info={t("today.kpi.onlineInfo")} value={fmtPercent(k.onlineFulfillment)} delta={{ text: fmtDeltaPp(CHAIN_DELTAS.onlineFulfillmentPp), tone: deltaTone(CHAIN_DELTAS.onlineFulfillmentPp, true) }} foot={t("today.vs.4w")} />
        <KpiCard icon={Banknote} iconTone="bad" label={t("stores.kpi.lostSales")} info={t("today.kpi.lostSalesInfo")} value={fmtAmd(k.lostSales4w)} delta={{ text: fmtDeltaPct(CHAIN_DELTAS.lostSalesPct, 0), tone: deltaTone(CHAIN_DELTAS.lostSalesPct, false) }} foot={t("today.vs.4w")} />
        <KpiCard icon={ListChecks} iconTone="primary" label={t("stores.kpi.actedOn")} info={t("stores.kpi.actedOnInfo")} value={fmtPercent(k.suggestionsActedOn, 0)} delta={{ text: fmtDeltaPp(CHAIN_DELTAS.actedOnPp, 0), tone: deltaTone(CHAIN_DELTAS.actedOnPp, true) }} foot={t("today.vs.4w")} />
      </section>

      <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <DistrictMap selected={district} onSelect={setDistrict} />
          <Card className="px-5 py-[18px]">
            <div className="mb-2.5 flex items-start gap-3">
              <IconTile icon={Lightbulb} tone="primary" size="lg" />
              <div className="font-semibold leading-snug">{t("stores.insight.title")}</div>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-line py-2.5">
              <span>{t("stores.insight.high", { pct: HIGH_ADOPTION_PCT, count: insight.high.count })}</span>
              <b className="text-lg text-good">{fmtPercent(insight.high.availability)}</b>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-2.5">
              <span>{t("stores.insight.rest", { count: insight.rest.count })}</span>
              <b className="text-lg text-warn">{fmtPercent(insight.rest.availability)}</b>
            </div>
            <div className="mt-1 text-xs text-muted">{t("stores.insight.note")}</div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3.5 pt-[18px]">
            <div>
              <div className="text-base font-semibold">
                {district ? t("stores.table.titleDistrict", { district: loc(getDistrict(district).name) }) : t("stores.table.title")}
              </div>
              <div className="mt-0.5 text-[13px] text-muted">{t("stores.table.subtitle")}</div>
            </div>
            <Button onClick={exportCsv}>
              <FileSpreadsheet />
              {t("stores.table.export")}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr>
                  <th className={th}>{t("stores.table.store")}</th>
                  <SortTh k="availability" label={t("stores.table.availability")} />
                  <SortTh k="onlineFulfillment" label={t("stores.table.online")} right />
                  <SortTh k="lostSales4w" label={t("stores.table.lostSales")} right />
                  <SortTh k="suggestionsActedOn" label={t("stores.table.actedOnShort")} right />
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="[&_tr:last-child_td]:border-0">
                {rows.map((s) => {
                  const a = s.kpis.availability;
                  return (
                    <tr key={s.id} className="cursor-pointer hover:bg-subtle" onClick={() => openStore(s)}>
                      <td className={td}>
                        <div className="whitespace-nowrap font-semibold">
                          {s.code} {loc(s.name)}
                        </div>
                        <div className="text-xs text-muted">{s.manager.name}</div>
                      </td>
                      <td className={td}>
                        <Pill tone={availabilityTone(a)}>{fmtPercent(a)}</Pill>
                        <div className="mt-0.5 whitespace-nowrap pl-1 text-xs text-muted">{t(`stores.status.${availabilityStatus(a)}`)}</div>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{fmtPercent(s.kpis.onlineFulfillment)}</td>
                      <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{fmtAmd(s.kpis.lostSales4w, { fixed: true })}</td>
                      <td className={`${td} text-right tabular-nums ${s.kpis.suggestionsActedOn < 70 ? "font-semibold text-bad" : ""}`}>{fmtPercent(s.kpis.suggestionsActedOn, 0)}</td>
                      <td className={`${td} w-8`}>
                        <ChevronRight className="size-[18px] text-faint" aria-label={t("stores.table.open")} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </>
  );
}
