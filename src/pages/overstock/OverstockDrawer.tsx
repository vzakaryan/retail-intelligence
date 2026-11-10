import { Boxes } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { daysOfStock, extraValue, type OverRow } from "@/data/overstock";
import { getProduct } from "@/data/products";
import { SUPPLIERS } from "@/data/world";
import { Drawer } from "@/components/ui/Drawer";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { TONE } from "@/components/ui/tone";
import { fmtAmd, fmtDate, fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { useParamText } from "@/pages/stockouts/shared";
import { StepList, StepsFooter } from "@/pages/stockouts/StepList";

export const overTone = (r: OverRow) => (daysOfStock(r) / r.target >= 2.5 ? "bad" : "warn");

/** Overstock product panel — docs/design-references/approved/12-overstock-product-drawer.png */
export function OverstockDrawer({ row, onClose }: { row?: OverRow; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
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
            <Pill tone={overTone(row)}>{t("overstock.days", { count: daysOfStock(row) })}</Pill>
          </div>
        )
      }
      footer={row && <StepsFooter steps={row.steps} onClose={onClose} />}
    >
      {row && <Body row={row} />}
    </Drawer>
  );
}

function Body({ row }: { row: OverRow }) {
  const { t } = useTranslation();
  const params = useParamText();
  const weeks = row.sold.map((_, i) => fmtDate(new Date(2026, 8, 21 + i * 7), { month: "short", day: "numeric" }));
  const data = row.sold.map((s, i) => ({ label: weeks[i], sold: s, delivered: row.delivered[i] }));
  return (
    <div className="flex flex-col gap-5">
      <div className={`flex gap-3 rounded-xl px-4 py-3.5 ${TONE[overTone(row)]}`}>
        <Boxes className="mt-0.5 size-5 shrink-0" />
        <div>
          <div className="text-[15px] font-bold text-ink">{t("overstock.drawer.title", { days: daysOfStock(row), target: row.target })}</div>
          <p className="mt-1 text-[13.5px] text-ink-2">
            {t(`overstock.reason.${row.reason.key}`, params(row.reason.params))}{" "}
            {t("overstock.drawer.extra", { extra: row.extraUnits, total: row.inStore, value: fmtAmd(extraValue(row)) })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          [t("overstock.drawer.inStore"), fmtNumber(row.inStore), ""],
          [t("overstock.drawer.perDay"), fmtNumber(row.perDay), ""],
          [t("overstock.drawer.extraUnits"), fmtNumber(row.extraUnits), "text-warn"],
        ].map(([label, v, cls]) => (
          <div key={label} className="rounded-xl border border-line px-3.5 py-3">
            <div className="text-[12.5px] text-muted">{label}</div>
            <div className={`mt-0.5 text-xl font-bold ${cls}`}>{v}</div>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-1 font-semibold">{t("overstock.drawer.chartTitle")}</h3>
        <div className="mb-1.5 flex gap-4 text-[12.5px] text-ink-2">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-primary-200" />{t("overstock.drawer.sold")}</span>
          <span className="flex items-center gap-1.5"><i className="h-[3px] w-4 rounded bg-warn" />{t("overstock.drawer.delivered")}</span>
        </div>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f0f0f5" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} allowDecimals={false} />
              <Bar dataKey="sold" fill="#cfc4fb" radius={[5, 5, 0, 0]} isAnimationActive={false} maxBarSize={26} />
              <Line dataKey="delivered" stroke="#b86a05" strokeWidth={2.5} dot={{ r: 3, fill: "#b86a05" }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <StepList steps={row.steps} />
    </div>
  );
}
