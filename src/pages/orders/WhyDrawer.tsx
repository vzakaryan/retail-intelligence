import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LineView, OrderView } from "@/app/useOrders";
import { coverDays, coverStart, getLineInsight } from "@/data/orders";
import { DEMO_NOW } from "@/data/world";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { QtyInput } from "@/components/ui/QtyInput";
import { fmtDate, fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { pick } from "@/lib/names";

interface Props {
  view: OrderView;
  line?: LineView;
  qty: number;
  onQty: (v: number) => void;
  onAccept: () => void;
  onClose: () => void;
}

const addDays = (date: Date, n: number) => {
  const x = new Date(date);
  x.setDate(x.getDate() + n);
  return x;
};
const md = (date: Date) => fmtDate(date, { month: "short", day: "numeric" });

/** "Why?" panel — docs/design-references/approved/04-order-why-suggestion.png */
export function WhyDrawer({ view, line, qty, onQty, onAccept, onClose }: Props) {
  const { t } = useTranslation();
  const loc = useLocalized();

  return (
    <Drawer
      open={!!line}
      onClose={onClose}
      closeLabel={t("common.close")}
      header={
        line && (
          <div className="flex items-center gap-3.5">
            <ProductThumb emoji={line.product.emoji} />
            <div className="min-w-0">
              <div className="truncate text-lg font-bold">{loc(line.product.name)}</div>
              <div className="text-xs text-muted">
                {line.product.sku} · {pick(view.supplier.name)}
              </div>
            </div>
          </div>
        )
      }
      footer={
        line && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <span className="whitespace-nowrap font-semibold">{t("orders.review.yourQty")}</span>
              <QtyInput value={qty} onChange={onQty} changed={qty !== line.suggested} label={t("orders.review.yourQty")} />
              <span className="text-xs text-muted">{t("orders.why.changeNote")}</span>
            </div>
            <div className="grid grid-cols-[2fr_1fr] gap-2.5">
              <Button variant="primary" className="justify-center py-[11px] text-sm" onClick={onAccept}>
                <Check />
                {t("orders.review.acceptQty", { qty })}
              </Button>
              <Button className="justify-center py-[11px] text-sm" onClick={onClose}>
                {t("common.close")}
              </Button>
            </div>
          </>
        )
      }
    >
      {line && <WhyBody view={view} line={line} />}
    </Drawer>
  );
}

function WhyBody({ view, line }: { view: OrderView; line: LineView }) {
  const { t } = useTranslation();
  const insight = getLineInsight(view.order, line.line);
  const days = coverDays(view.order);
  const start = coverStart();
  const perDay = line.line.expected / days;
  const safetyDays = Math.max(1, Math.round(line.line.safetyStock / perDay));
  const l = line.line;

  const firstSold = addDays(DEMO_NOW, -(insight.sold.length - 1));
  const data = [
    ...insight.sold.map((v, i) => ({ date: addDays(firstSold, i), value: v, kind: i === insight.stockoutDay ? "empty" : "sold" })),
    ...insight.expectedDaily.map((v, i) => ({ date: addDays(start, i), value: v, kind: "expected" })),
  ].map((x) => ({ ...x, label: md(x.date) }));
  // Label a few days only; skip the first expected day when it would collide with the last one.
  const last = data.length - 1;
  const tickIdx = new Set([0, 4, 8, insight.stockoutDay ?? 11, last, ...(last - insight.sold.length >= 3 ? [insight.sold.length] : [])]);

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="mb-2 font-semibold">{t("orders.why.title", { qty: line.suggested })}</h3>
        <div className="overflow-hidden rounded-xl border border-line">
          <CalcRow op="" label={t("orders.why.expected", { from: md(start), to: md(view.order.coversUntil) })} value={l.expected} />
          <CalcRow op="+" label={t("orders.why.safety", { count: safetyDays })} value={l.safetyStock} />
          {line.extraSafety > 0 && <CalcRow op="+" label={t("orders.why.extraSafety", { supplier: pick(view.supplier.name) })} value={line.extraSafety} />}
          <CalcRow op="−" label={t("orders.why.inStore")} value={l.inStore} />
          <CalcRow op="−" label={t("orders.why.onTheWay")} value={l.onTheWay} />
          <div className="flex justify-between bg-primary-50 px-3.5 py-2.5 font-bold text-primary">
            <span>
              <span className="inline-block w-[18px]">=</span>
              {t("orders.why.suggested")}
            </span>
            <span>{t("orders.why.units", { count: line.suggested })}</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-1.5 font-semibold">{t("orders.why.salesTitle")}</h3>
        <div className="mb-1.5 flex flex-wrap gap-4 text-[12.5px] text-ink-2">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-primary-200" />{t("orders.why.legendSold")}</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] border-[1.5px] border-dashed border-primary" />{t("orders.why.legendExpected")}</span>
          {insight.stockoutDay !== undefined && (
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-[#f4b4b4]" />{t("orders.why.legendEmpty")}</span>
          )}
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f0f0f5" />
              <XAxis
                dataKey="label"
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#7a7f93" }}
                tickFormatter={(v: string, i: number) => (tickIdx.has(i) ? v : "")}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(91,63,224,.06)" }}
                formatter={(v) => [fmtNumber(Number(v)), t("orders.why.tooltipUnits")]}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{ borderRadius: 10, border: "1px solid #e9e9f0", fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} isAnimationActive={false}>
                {data.map((x, i) => (
                  <Cell
                    key={i}
                    fill={x.kind === "expected" ? "rgba(91,63,224,.08)" : x.kind === "empty" ? "#f4b4b4" : "#cfc4fb"}
                    stroke={x.kind === "expected" ? "#5b3fe0" : "none"}
                    strokeDasharray={x.kind === "expected" ? "4 3" : undefined}
                    strokeWidth={x.kind === "expected" ? 1.5 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="mb-1 font-semibold">{t("orders.why.historyTitle")}</h3>
        {insight.history.map((h) => (
          <div key={h.date.toISOString()} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
            <span>
              {md(h.date)} · {t("orders.why.suggestedN", { count: h.suggested })},{" "}
              <span className={h.ordered !== h.suggested ? "font-bold" : ""}>{t("orders.why.orderedN", { count: h.ordered })}</span>
            </span>
            {h.ranOutAt ? (
              <Pill tone="bad">{t("orders.why.ranOut", { day: fmtDate(h.ranOutAt.day, { weekday: "short" }), time: h.ranOutAt.time })}</Pill>
            ) : (
              <Pill tone="good">{t("orders.why.noStockout")}</Pill>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function CalcRow({ op, label, value }: { op: string; label: string; value: number }) {
  return (
    <div className="flex justify-between border-b border-line px-3.5 py-[9px]">
      <span>
        <span className="inline-block w-[18px] text-muted">{op}</span>
        {label}
      </span>
      <b className="tabular-nums">{fmtNumber(value)}</b>
    </div>
  );
}
