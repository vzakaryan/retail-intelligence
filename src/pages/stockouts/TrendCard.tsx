import { useTranslation } from "react-i18next";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { StoreStockouts } from "@/data/stockouts";
import { Card } from "@/components/ui/Card";
import { fmtDate, fmtPercent } from "@/lib/format";

/** Weekly out-of-stock rate, before vs. with Retail Intelligence. */
export function TrendCard({ trend }: { trend: StoreStockouts["trend"] }) {
  const { t } = useTranslation();
  const last = trend.values.length - 1;
  const data = trend.values.map((v, i) => ({
    v,
    label: i === last ? t("stockouts.trend.thisWeek") : fmtDate(trend.weeks[i], { month: "short", day: "numeric" }),
    fill: i < trend.before ? "#e4e5ec" : i === last ? "#5b3fe0" : "#cfc4fb",
    text: i < trend.before ? "#7a7f93" : "#5b3fe0",
  }));
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-[18px]">
        <div>
          <div className="text-base font-semibold">{t("stockouts.trend.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("stockouts.trend.subtitle")}</div>
        </div>
        <div className="flex gap-4 whitespace-nowrap text-[12.5px] text-ink-2">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-[#e4e5ec]" />{t("stockouts.trend.before")}</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-primary-200" />{t("stockouts.trend.with")}</span>
        </div>
      </div>
      <div className="h-[230px] px-3 pb-3 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 22, right: 8, left: 8, bottom: 0 }}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11, fill: "#7a7f93" }} />
            <YAxis hide domain={[0, 8]} />
            <Bar dataKey="v" radius={[7, 7, 0, 0]} isAnimationActive={false} barSize={34}>
              {data.map((x, i) => (
                <Cell key={i} fill={x.fill} />
              ))}
              <LabelList
                dataKey="v"
                position="top"
                content={(p) => {
                  const { x = 0, y = 0, width = 0, index = 0, value } = p as { x?: number; y?: number; width?: number; index?: number; value?: number };
                  return (
                    <text x={Number(x) + Number(width) / 2} y={Number(y) - 6} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={data[index].text}>
                      {fmtPercent(Number(value))}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
