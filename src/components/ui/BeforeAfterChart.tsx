import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card } from "./Card";
import { TwoLineTick } from "./ChartTick";
import { fmtChartDate } from "@/lib/format";

interface Props {
  title: string;
  subtitle: string;
  /** Weekly values, oldest first; the last one is "this week" */
  values: number[];
  /** How many of the first weeks were before Retail Intelligence */
  before: number;
  /** Monday of the first week */
  firstWeek: Date;
  format: (v: number) => string;
  /** Extra content under the chart, e.g. a "less stock, same sales" strip */
  footer?: ReactNode;
}

/** Weekly bars: grey before Retail Intelligence, purple with it, this week highlighted. */
export function BeforeAfterChart({ title, subtitle, values, before, firstWeek, format, footer }: Props) {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const last = values.length - 1;
  // Narrow charts (phones): date under every other bar, counting back from "this week"
  const step = width / values.length < 44 ? 2 : 1;
  const max = Math.max(...values) * 1.18;
  const data = values.map((v, i) => {
    const week = new Date(firstWeek);
    week.setDate(week.getDate() + i * 7);
    return {
      v,
      label: i === last ? t("stockouts.trend.thisWeek") : (last - i) % step === 0 ? fmtChartDate(week) : "",
      fill: i < before ? "#e4e5ec" : i === last ? "#5b3fe0" : "#cfc4fb",
      text: i < before ? "#7a7f93" : "#5b3fe0",
    };
  });
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-[18px]">
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="mt-0.5 text-[13px] text-muted">{subtitle}</div>
        </div>
        <div className="flex gap-4 whitespace-nowrap text-[12.5px] text-ink-2">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-[#e4e5ec]" />{t("stockouts.trend.before")}</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-primary-200" />{t("stockouts.trend.with")}</span>
        </div>
      </div>
      <div ref={box} className="h-[230px] px-3 pb-3 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 22, right: 8, left: 8, bottom: 0 }}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} height={34} tick={<TwoLineTick highlight={t("stockouts.trend.thisWeek")} />} />
            <YAxis hide domain={[0, max]} />
            <Bar dataKey="v" radius={[7, 7, 0, 0]} isAnimationActive={false} maxBarSize={34}>
              {data.map((x, i) => (
                <Cell key={i} fill={x.fill} />
              ))}
              <LabelList
                dataKey="v"
                position="top"
                content={(p) => {
                  const { x = 0, y = 0, width = 0, index = 0, value } = p as { x?: number; y?: number; width?: number; index?: number; value?: number };
                  // On narrow charts only the bars with a date get a value, so numbers don't touch
                  if (step > 1 && !data[index].label) return null;
                  return (
                    <text x={Number(x) + Number(width) / 2} y={Number(y) - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill={data[index].text}>
                      {format(Number(value))}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {footer}
    </Card>
  );
}
