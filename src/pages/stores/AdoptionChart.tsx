import { useTranslation } from "react-i18next";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import type { chainSummary, StoreRow } from "@/data/storeCompare";
import type { Store } from "@/data/types";
import { HIGH_ADOPTION_PCT } from "@/data/world";
import { Card } from "@/components/ui/Card";
import { fmtAmd, fmtNumber } from "@/lib/format";
import { useStoreLabel } from "@/lib/useStoreLabel";
import { pick } from "@/lib/names";

interface Point {
  x: number;
  y: number;
  row: StoreRow;
}

/** One dot per store: suggestions acted on vs. platform impact per week. */
export function AdoptionChart({ rows, chain, onOpen }: { rows: StoreRow[]; chain: ReturnType<typeof chainSummary>; onOpen: (s: Store) => void }) {
  const { t } = useTranslation();
  const label = useStoreLabel();
  const data: Point[] = rows.map((r) => ({ x: r.actedOn, y: Math.round(r.impactPerWeek / 1000), row: r }));
  const { high, rest } = chain.adoption;
  const ratio = rest.perWeek ? Math.round((high.perWeek / rest.perWeek) * 10) / 10 : 1;

  return (
    <Card>
      <div className="px-5 pt-[18px]">
        <div className="text-base font-semibold">{t("stores.adoption.title")}</div>
        <div className="mt-0.5 text-[13px] text-muted">{t("stores.adoption.subtitle")}</div>
      </div>
      <div className="h-[280px] px-2 pb-1 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 18, left: 4, bottom: 18 }}>
            <CartesianGrid stroke="#f0f0f5" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[50, 100]}
              ticks={[50, 60, 70, 80, 90, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 11, fill: "#7a7f93" }}
              tickLine={false}
              axisLine={false}
              label={{ value: t("stores.adoption.x"), position: "insideBottom", offset: -12, fontSize: 11, fill: "#7a7f93" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              tickFormatter={(v: number) => fmtAmd(v * 1000, { thousands: true })}
              tick={{ fontSize: 11, fill: "#7a7f93" }}
              tickLine={false}
              axisLine={false}
              width={74}
            />
            <ReferenceLine x={HIGH_ADOPTION_PCT} stroke="#b3b6c4" strokeDasharray="4 4" />
            <Tooltip
              cursor={false}
              content={({ payload }) => {
                const p = payload?.[0]?.payload as Point | undefined;
                if (!p) return null;
                return (
                  <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg">
                    <div className="font-semibold text-ink">{label.full(p.row.store)}</div>
                    <div className="text-muted">{pick(p.row.store.manager.name)}</div>
                    <div className="mt-1 text-ink-2">
                      {t("stores.adoption.tip", { acted: fmtNumber(p.x), amount: fmtAmd(p.row.impactPerWeek, { thousands: true }) })}
                    </div>
                  </div>
                );
              }}
            />
            <Scatter
              data={data}
              isAnimationActive={false}
              onClick={(p) => onOpen((p as unknown as Point).row.store)}
              shape={(props: unknown) => {
                const { cx = 0, cy = 0, payload } = props as { cx?: number; cy?: number; payload: Point };
                const hi = payload.x >= HIGH_ADOPTION_PCT;
                return (
                  <g className="cursor-pointer">
                    <circle cx={cx} cy={cy} r={13} fill={hi ? "#5b3fe0" : "#e8a23a"} fillOpacity={0.9} />
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#fff">
                      {payload.row.store.number}
                    </text>
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mx-5 mb-5 rounded-xl bg-primary-50 px-4 py-3 text-[13.5px] text-ink-2">
        <b className="text-ink">{t("stores.adoption.insight", { ratio: fmtNumber(ratio, 1) })}</b>{" "}
        {t("stores.adoption.detail", {
          pct: HIGH_ADOPTION_PCT,
          high: fmtAmd(high.perWeek, { thousands: true }),
          highCount: high.count,
          rest: fmtAmd(rest.perWeek, { thousands: true }),
          restCount: rest.count,
          count: rest.count,
        })}
      </div>
    </Card>
  );
}
