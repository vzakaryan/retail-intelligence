import { BadgePercent, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { UpcomingPromo } from "@/data/promotions";
import { getProduct } from "@/data/products";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { IconTile } from "@/components/ui/IconTile";
import { Pill } from "@/components/ui/Pill";
import { TONE } from "@/components/ui/tone";
import { fmtAmd, fmtDate, fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { StepList, StepsFooter } from "@/pages/stockouts/StepList";
import { usePromoDates } from "./shared";
import { usePromoReadiness } from "./usePromoReadiness";

/** Promotion panel — docs/design-references/approved/18-promotion-drawer.png */
export function PromoDrawer({ promo, onClose }: { promo?: UpcomingPromo; onClose: () => void }) {
  const { t } = useTranslation();
  const dates = usePromoDates();
  const ready = usePromoReadiness();
  const r = promo && ready(promo);
  return (
    <Drawer
      open={!!promo}
      onClose={onClose}
      closeLabel={t("common.close")}
      header={
        promo &&
        r && (
          <div className="flex items-center gap-3.5">
            <IconTile icon={BadgePercent} tone="primary" size="lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold">{t(`promotions.name.${promo.name.key}`, promo.name.params)}</div>
              <div className="text-xs text-muted">{t("promotions.drawer.meta", { dates: dates(promo), count: promo.productCount })}</div>
            </div>
            {r.total > 0 && <Pill tone={r.done === r.total ? "good" : "warn"}>{t("promotions.drawer.ready", { done: r.done, total: r.total })}</Pill>}
          </div>
        )
      }
      footer={
        promo &&
        (promo.steps.length ? (
          <StepsFooter steps={promo.steps} onClose={onClose} />
        ) : (
          <Button className="w-full justify-center py-[11px] text-sm" onClick={onClose}>
            {t("common.close")}
          </Button>
        ))
      }
    >
      {promo && <Body promo={promo} />}
    </Drawer>
  );
}

function Body({ promo }: { promo: UpcomingPromo }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const f = promo.focus;
  const days = f && promo.to ? Array.from({ length: f.normal.length }, (_, i) => fmtDate(new Date(promo.from.getTime() + i * 86_400_000), { weekday: "short" })) : [];
  const data = f ? days.map((label, i) => ({ label, normal: f.normal[i], promo: f.promo[i] })) : [];
  const fName = f && loc(getProduct(f.productId).name);

  return (
    <div className="flex flex-col gap-5">
      <div className={`flex gap-3 rounded-xl px-4 py-3.5 ${TONE.primary}`}>
        <TrendingUp className="mt-0.5 size-5 shrink-0" />
        <div>
          <div className="text-[15px] font-bold text-ink">{t("promotions.drawer.title", { pct: promo.upliftPct })}</div>
          <p className="mt-1 text-[13.5px] text-ink-2">
            {f ? t("promotions.drawer.text", { product: fName, extra: f.extraUnits, unit: t(`promotions.unit.${f.unit}`), days: f.normal.length }) : t(`promotions.note.${promo.note?.key ?? "remindLater"}`)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          [t("promotions.drawer.products"), fmtNumber(promo.productCount)],
          [t("promotions.drawer.extraSales"), fmtAmd(promo.extraSales)],
          f ? [t("promotions.drawer.extraNeeded", { product: fName?.split(" ")[0] }), `${fmtNumber(f.extraUnits)} ${t(`promotions.unit.${f.unit}Short`)}`] : [t("promotions.drawer.uplift"), `+${promo.upliftPct}%`],
        ].map(([label, v]) => (
          <div key={label} className="rounded-xl border border-line px-3.5 py-3">
            <div className="truncate text-[12.5px] text-muted">{label}</div>
            <div className="mt-0.5 text-xl font-bold">{v}</div>
          </div>
        ))}
      </div>

      {f && (
        <section>
          <h3 className="mb-1 font-semibold">{t("promotions.drawer.chartTitle", { product: fName })}</h3>
          <div className="mb-1.5 flex gap-4 text-[12.5px] text-ink-2">
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-[#e4e5ec]" />{t("promotions.drawer.normal")}</span>
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-primary" />{t("promotions.drawer.withPromo")}</span>
          </div>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f0f0f5" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} allowDecimals={false} />
                <Bar dataKey="normal" fill="#e4e5ec" radius={[5, 5, 0, 0]} isAnimationActive={false} maxBarSize={44} />
                <Bar dataKey="promo" fill="#5b3fe0" radius={[5, 5, 0, 0]} isAnimationActive={false} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {promo.steps.length > 0 ? (
        <StepList steps={promo.steps} />
      ) : (
        promo.note && <div className="rounded-xl border border-line px-4 py-3 text-ink-2">{t(`promotions.note.${promo.note.key}`)}</div>
      )}
    </div>
  );
}
