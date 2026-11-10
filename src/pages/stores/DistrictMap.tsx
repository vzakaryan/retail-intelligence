import { useTranslation } from "react-i18next";
import { DISTRICTS, districtStats } from "@/data/world";
import { Card } from "@/components/ui/Card";
import { TONE } from "@/components/ui/tone";
import { fmtPercent } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { availabilityTone } from "./tones";

interface Props {
  selected?: string;
  onSelect: (districtId?: string) => void;
}

/** Schematic tile map of Yerevan districts — each tile shows average availability. */
export function DistrictMap({ selected, onSelect }: Props) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const withStores = DISTRICTS.filter((d) => districtStats(d.id).count > 0).length;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 px-5 pt-[18px]">
        <div>
          <div className="text-base font-semibold">{t("stores.map.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("stores.map.subtitle", { stores: 12, districts: withStores })}</div>
        </div>
        {selected && (
          <button className="text-[13px] font-semibold text-primary hover:underline" onClick={() => onSelect(undefined)}>
            {t("stores.map.clear")}
          </button>
        )}
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="grid grid-cols-4 gap-1.5">
          {DISTRICTS.map((d) => {
            const s = districtStats(d.id);
            const has = s.count > 0 && s.availability !== undefined;
            const isSel = selected === d.id;
            const style = { gridColumn: d.grid.col, gridRow: d.grid.row };
            if (!has)
              return (
                <div key={d.id} style={style} className="flex min-h-16 flex-col justify-between rounded-ctl bg-[#f3f3f7] p-2 text-[#a3a7b7]">
                  <div className="text-[11.5px] font-semibold leading-tight">{loc(d.name)}</div>
                  <div className="text-[11px]">{t("stores.map.noStores")}</div>
                </div>
              );
            return (
              <button
                key={d.id}
                style={style}
                onClick={() => onSelect(isSel ? undefined : d.id)}
                aria-pressed={isSel}
                className={`flex min-h-16 flex-col justify-between rounded-ctl p-2 text-left transition-shadow hover:shadow-[inset_0_0_0_2px_currentColor] ${TONE[availabilityTone(s.availability!)]} ${
                  isSel ? "shadow-[inset_0_0_0_2px_var(--color-primary)]" : ""
                } ${selected && !isSel ? "opacity-50" : ""}`}
              >
                <div className="text-[11.5px] font-semibold leading-tight">{loc(d.name)}</div>
                <div>
                  <div className="text-[15px] font-bold">{fmtPercent(s.availability!)}</div>
                  <div className="text-[11px] opacity-80">{t("stores.map.stores", { count: s.count })}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted">
          {(["good", "warn", "bad"] as const).map((tone) => (
            <span key={tone} className="flex items-center gap-1.5 whitespace-nowrap">
              <i className={`h-3 w-4 rounded-full ${TONE[tone]}`} />
              {t(`stores.map.legend.${tone}`)}
            </span>
          ))}
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <i className="h-3 w-4 rounded-full bg-[#f3f3f7]" />
            {t("stores.map.noStores")}
          </span>
        </div>
        <p className="mt-2 text-center text-xs text-muted">{t("stores.map.hint")}</p>
      </div>
    </Card>
  );
}
