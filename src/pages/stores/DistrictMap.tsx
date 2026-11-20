import { useState } from "react";
import { useTranslation } from "react-i18next";
import { chainAverage, compareTone, type Metric, type StoreRow } from "@/data/storeCompare";
import { DISTRICTS } from "@/data/world";
import { Card } from "@/components/ui/Card";
import { Dropdown } from "@/components/ui/Dropdown";
import { TONE } from "@/components/ui/tone";
import { useLocalized } from "@/lib/useLocalized";
import { useMetricFormat } from "./metricFormat";

type MapMetric = Extract<Metric, "impactPerWeek" | "salesGrowth" | "oos">;
const MEASURES: MapMetric[] = ["impactPerWeek", "salesGrowth", "oos"];

interface Props {
  rows: StoreRow[];
  selected?: string;
  onSelect: (districtId?: string) => void;
}

/** Schematic tile map of Yerevan districts, coloured by a chosen measure vs. the chain average. */
export function DistrictMap({ rows, selected, onSelect }: Props) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const fmt = useMetricFormat();
  const [measure, setMeasure] = useState<MapMetric>("impactPerWeek");
  const avg = chainAverage(rows, measure);
  const withStores = DISTRICTS.filter((d) => rows.some((r) => r.store.districtId === d.id)).length;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 px-5 pt-[18px]">
        <div>
          <div className="text-base font-semibold">{t("stores.map.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("stores.map.subtitle", { stores: rows.length, districts: withStores })}</div>
        </div>
      </div>
      <div className="px-5 pt-3">
        <Dropdown
          label={t("stores.map.colourBy")}
          value={measure}
          onChange={setMeasure}
          options={MEASURES.map((m) => ({ value: m, label: t(`stores.map.measure.${m}`) }))}
        />
      </div>
      <div className="px-5 pb-5 pt-3">
        <div className="grid grid-cols-4 gap-1.5">
          {DISTRICTS.map((d) => {
            const inD = rows.filter((r) => r.store.districtId === d.id);
            const isSel = selected === d.id;
            const style = { gridColumn: `${d.grid.col} / span ${d.grid.span ?? 1}`, gridRow: d.grid.row };
            if (!inD.length)
              return (
                <div key={d.id} style={style} className="flex min-h-16 min-w-0 flex-col justify-between gap-1 overflow-hidden rounded-ctl bg-[#f3f3f7] px-1.5 py-2 text-[#a3a7b7]">
                  <div lang="en" className="hyphens-auto text-[11px] font-semibold leading-tight [overflow-wrap:anywhere]">{loc(d.name)}</div>
                  <div className="text-[11px]">{t("stores.map.noStores")}</div>
                </div>
              );
            const v = chainAverage(inD, measure);
            const tone = compareTone(v, avg, measure);
            return (
              <button
                key={d.id}
                style={style}
                onClick={() => onSelect(isSel ? undefined : d.id)}
                aria-pressed={isSel}
                className={`flex min-h-16 min-w-0 flex-col justify-between gap-1 overflow-hidden rounded-ctl px-1.5 py-2 text-left transition-shadow hover:shadow-[inset_0_0_0_2px_currentColor] ${TONE[tone]} ${
                  isSel ? "shadow-[inset_0_0_0_2px_var(--color-primary)]" : ""
                } ${selected && !isSel ? "opacity-50" : ""}`}
              >
                <div lang="en" className="hyphens-auto text-[11px] font-semibold leading-tight [overflow-wrap:anywhere]">{loc(d.name)}</div>
                <div>
                  <div className="text-[12.5px] font-bold leading-tight">{fmt(measure, v)}</div>
                  <div className="text-[11px] opacity-80">{t("stores.map.stores", { count: inD.length })}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted">
          {(["good", "neutral", "bad"] as const).map((tone) => (
            <span key={tone} className="flex items-center gap-1.5 whitespace-nowrap">
              <i className={`h-3 w-4 rounded-full ${TONE[tone]}`} />
              {t(`stores.map.vsAvg.${tone}`)}
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted">{t("stores.map.hint")}</p>
      </div>
    </Card>
  );
}
