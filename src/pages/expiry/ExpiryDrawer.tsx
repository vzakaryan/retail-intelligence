import { CalendarClock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { atRiskUnits, atRiskValue, type ExpiryRow } from "@/data/expiry";
import { getProduct } from "@/data/products";
import { SUPPLIERS } from "@/data/world";
import { Drawer } from "@/components/ui/Drawer";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { TONE } from "@/components/ui/tone";
import { fmtAmd, fmtDate, fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { StepList, StepsFooter } from "@/pages/stockouts/StepList";
import { useExpiresText } from "./shared";

/** Expiry product panel — docs/design-references/approved/14-expiry-product-drawer.png */
export function ExpiryDrawer({ row, onClose }: { row?: ExpiryRow; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const expires = useExpiresText();
  const product = row && getProduct(row.productId);
  return (
    <Drawer
      open={!!row}
      onClose={onClose}
      closeLabel={t("common.close")}
      header={
        row &&
        product && (
          <div className="flex items-center gap-3.5">
            <ProductThumb emoji={product.emoji} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold">{loc(product.name)}</div>
              <div className="text-xs text-muted">
                {product.sku} · {SUPPLIERS.find((s) => s.id === product.supplierId)?.name}
              </div>
            </div>
            <Pill tone={row.tone}>{t("expiry.drawer.expires", { when: expires(row) })}</Pill>
          </div>
        )
      }
      footer={row && row.steps.length > 0 && <StepsFooter steps={row.steps} onClose={onClose} />}
    >
      {row && <Body row={row} />}
    </Drawer>
  );
}

function Body({ row }: { row: ExpiryRow }) {
  const { t } = useTranslation();
  const risk = atRiskUnits(row);
  const perDay = row.daily ? Math.round(row.daily.normal.reduce((a, b) => a + b, 0) / row.daily.normal.length) : undefined;
  const withMd = row.daily?.markdown?.reduce((a, b) => a + b, 0);
  const days = row.daily?.normal.map((_, i) => (i === 0 ? t("orders.day.today") : fmtDate(new Date(2026, 10, 10 + i), { weekday: "short" }))) ?? [];
  const data = days.map((label, i) => ({ label, normal: row.daily!.normal[i], markdown: row.daily?.markdown?.[i] }));

  if (row.handled) {
    return (
      <div className={`rounded-xl px-4 py-3.5 font-semibold ${TONE.good}`}>{t("expiry.drawer.handled", { units: row.expiring, at: row.handled.at })}</div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={`flex gap-3 rounded-xl px-4 py-3.5 ${TONE[row.tone === "bad" ? "bad" : "warn"]}`}>
        <CalendarClock className="mt-0.5 size-5 shrink-0" />
        <div>
          <div className="text-[15px] font-bold text-ink">{t("expiry.drawer.title", { risk, total: row.expiring })}</div>
          <p className="mt-1 text-[13.5px] text-ink-2">
            {perDay !== undefined && t("expiry.drawer.normal", { perDay, sell: row.willSell, day: row.time ? t("expiry.drawer.tonight") : fmtDate(row.expires, { weekday: "long" }) })}
            {withMd !== undefined && ` ${t("expiry.drawer.withMarkdown", { cut: row.daily?.cut, sell: Math.min(withMd, row.expiring) })}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          [t("expiry.drawer.expiring"), fmtNumber(row.expiring), ""],
          [t("expiry.drawer.willSell"), fmtNumber(row.willSell), ""],
          [t("expiry.drawer.atRisk"), fmtAmd(atRiskValue(row), { thousands: true }), "text-warn"],
        ].map(([label, v, cls]) => (
          <div key={label} className="rounded-xl border border-line px-3.5 py-3">
            <div className="text-[12.5px] text-muted">{label}</div>
            <div className={`mt-0.5 text-xl font-bold ${cls}`}>{v}</div>
          </div>
        ))}
      </div>

      {data.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold">{t("expiry.drawer.chartTitle", { day: row.time ? t("expiry.drawer.tonight") : fmtDate(row.expires, { weekday: "long" }) })}</h3>
          <div className="mb-1.5 flex gap-4 text-[12.5px] text-ink-2">
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-[#e4e5ec]" />{t("expiry.drawer.normalPrice")}</span>
            {withMd !== undefined && (
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-primary" />{t("expiry.drawer.markdownLegend", { cut: row.daily?.cut })}</span>
            )}
          </div>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f0f0f5" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} allowDecimals={false} />
                <Bar dataKey="normal" fill="#e4e5ec" radius={[5, 5, 0, 0]} isAnimationActive={false} maxBarSize={44} />
                {withMd !== undefined && <Bar dataKey="markdown" fill="#5b3fe0" radius={[5, 5, 0, 0]} isAnimationActive={false} maxBarSize={44} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <StepList steps={row.steps} />
    </div>
  );
}
