import { useState } from "react";
import { Banknote, ChevronRight, Clock, PackageCheck, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useDemo } from "@/app/DemoContext";
import { getProduct } from "@/data/products";
import { getSuppliers, onTimePct, statusOf, type Delivery } from "@/data/suppliers";
import { DEMO_NOW, SUPPLIERS } from "@/data/world";
import { Card } from "@/components/ui/Card";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { TONE } from "@/components/ui/tone";
import { fmtAmd, fmtDate, fmtDeltaPp, fmtNumber, fmtPercent } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { SupplierDrawer } from "./SupplierDrawer";
import { STATUS_TONE, onTimeColor, useDelayText } from "./shared";

const th = "whitespace-nowrap border-b border-line bg-subtle px-4 py-2.5 text-left text-xs font-semibold text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-3 align-middle first:pl-5 last:pr-5";
const DOT = { onTime: "bg-good", late: "bg-bad", short: "bg-[#e09b2d]" } as const;

/** docs/design-references/approved/15-suppliers.png */
export function SuppliersPage() {
  const { t } = useTranslation();
  const { store, extraSafety } = useDemo();
  const delay = useDelayText();
  const data = getSuppliers(store.id);
  const [open, setOpen] = useState<string>();

  const rows = [...data.stats].sort((a, b) => onTimePct(a) - onTimePct(b) || b.lostSales - a.lostSales);
  const deliveries = data.stats.reduce((s, x) => s + x.deliveries, 0);
  const late = data.stats.reduce((s, x) => s + x.late, 0);
  const onTime = ((deliveries - late) / deliveries) * 100;
  const inFull = data.stats.reduce((s, x) => s + x.inFull * x.deliveries, 0) / deliveries;
  const lost = data.stats.reduce((s, x) => s + x.lostSales, 0);
  const worst = SUPPLIERS.find((s) => s.id === rows[0].supplierId)!.name;
  const trend = data.trend.weeks.map((w, i) => ({
    label: i === data.trend.weeks.length - 1 ? t("stockouts.trend.thisWeek") : fmtDate(w, { month: "short", day: "numeric" }),
    worst: data.trend.worst[i],
    others: data.trend.others[i],
  }));

  return (
    <>
      <PageHeader title={t("pages.suppliers.title")} subtitle={t("suppliers.subtitle")} actions={<span className="rounded-ctl border border-line bg-white px-3 py-2 font-medium text-ink-2">{t("suppliers.period")}</span>} />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Clock} iconTone="good" label={t("suppliers.kpi.onTime")} info={t("suppliers.kpi.onTimeInfo")} value={fmtPercent(onTime, 0)} delta={{ text: fmtDeltaPp(data.onTimeDeltaPp, 0), tone: deltaTone(data.onTimeDeltaPp, true) }} foot={t("today.vs.4w")} />
        <KpiCard icon={PackageCheck} iconTone="info" label={t("suppliers.kpi.inFull")} info={t("suppliers.kpi.inFullInfo")} value={fmtPercent(inFull)} delta={{ text: fmtDeltaPp(data.inFullDeltaPp), tone: deltaTone(data.inFullDeltaPp, true) }} foot={t("suppliers.kpi.inFullFoot")} />
        <KpiCard
          icon={Truck}
          iconTone="warn"
          label={t("suppliers.kpi.late")}
          value={
            <>
              {fmtNumber(late)} <small className="ml-0.5 text-base font-semibold text-ink-2">{t("suppliers.kpi.of", { total: deliveries })}</small>
            </>
          }
          delta={{ text: `${data.lateDelta < 0 ? "↓" : "↑"} ${Math.abs(data.lateDelta)}`, tone: deltaTone(data.lateDelta, false) }}
          foot={t("today.vs.4w")}
        />
        <KpiCard icon={Banknote} iconTone="bad" label={t("suppliers.kpi.cost")} info={t("suppliers.kpi.costInfo")} value={fmtAmd(lost)} foot={t("suppliers.kpi.costFoot")} />
      </section>

      <Card className="mb-6 overflow-hidden">
        <div className="px-5 pb-3.5 pt-[18px]">
          <div className="text-base font-semibold">{t("suppliers.table.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("suppliers.table.subtitle")}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t("suppliers.table.supplier")}</th>
                <th className={th}>{t("suppliers.table.onTime")}</th>
                <th className={`${th} text-right`}>{t("suppliers.table.inFull")}</th>
                <th className={`${th} text-right`}>{t("suppliers.table.delay")}</th>
                <th className={`${th} text-right`}>{t("suppliers.table.lost")}</th>
                <th className={th}>{t("suppliers.table.status")}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-0">
              {rows.map((s) => {
                const sup = SUPPLIERS.find((x) => x.id === s.supplierId)!;
                const pct = onTimePct(s);
                const st = statusOf(s);
                return (
                  <tr key={s.supplierId} className={`cursor-pointer ${open === s.supplierId ? "bg-primary-50" : "hover:bg-subtle"}`} onClick={() => setOpen(s.supplierId)}>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <div className={`grid size-10 shrink-0 place-items-center rounded-ctl text-[13px] font-bold ${TONE[sup.tone]}`}>{sup.initials}</div>
                        <div>
                          <div className="font-semibold">{sup.name}</div>
                          <div className="whitespace-nowrap text-xs text-muted">
                            {sup.categories.en} · {t("suppliers.table.deliveries", { count: s.deliveries })}
                            {s.late > 0 && `, ${t("suppliers.table.lateCount", { count: s.late })}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-[90px] overflow-hidden rounded-full bg-[#eeeef4]">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: onTimeColor(pct) }} />
                        </div>
                        <b className="tabular-nums">{pct}%</b>
                      </div>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{s.inFull}%</td>
                    <td className={`${td} whitespace-nowrap text-right`}>{delay(s)}</td>
                    <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{fmtAmd(s.lostSales, { thousands: true })}</td>
                    <td className={td}>
                      <Pill tone={STATUS_TONE[st]}>{t(`suppliers.status.${st}`)}</Pill>
                      {extraSafety[s.supplierId] && <div className="mt-1 whitespace-nowrap text-xs text-muted">{t("suppliers.table.safetyOn")}</div>}
                    </td>
                    <td className={`${td} w-8`}>
                      <ChevronRight className="size-[18px] text-faint" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <div className="px-5 pt-[18px]">
            <div className="text-base font-semibold">{t("suppliers.recent.title")}</div>
            <div className="mt-0.5 text-[13px] text-muted">{t("suppliers.recent.subtitle")}</div>
          </div>
          <ul className="px-5 pb-3 pt-1">
            {data.recent.map((r, i) => (
              <RecentRow key={i} r={r} />
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-[18px]">
            <div>
              <div className="text-base font-semibold">{t("suppliers.trend.title")}</div>
              <div className="mt-0.5 text-[13px] text-muted">{t("suppliers.trend.subtitle", { supplier: worst })}</div>
            </div>
            <div className="flex gap-4 whitespace-nowrap text-[12.5px] text-ink-2">
              <span className="flex items-center gap-1.5"><i className="h-[3px] w-4 rounded bg-bad" />{worst}</span>
              <span className="flex items-center gap-1.5"><i className="h-[3px] w-4 rounded bg-primary" />{t("suppliers.trend.others")}</span>
            </div>
          </div>
          <div className="h-[250px] px-3 pb-3 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 6, right: 12, left: -6, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f0f0f5" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} />
                <YAxis domain={[50, 100]} ticks={[50, 60, 70, 80, 90, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} tickFormatter={(v: number) => `${v}%`} />
                <Line dataKey="worst" stroke="#d63b3b" strokeWidth={2.5} dot={{ r: 3, fill: "#d63b3b" }} isAnimationActive={false} />
                <Line dataKey="others" stroke="#5b3fe0" strokeWidth={2.5} dot={{ r: 3, fill: "#5b3fe0" }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <SupplierDrawer stats={data.stats.find((s) => s.supplierId === open)} onClose={() => setOpen(undefined)} />
    </>
  );
}

function RecentRow({ r }: { r: Delivery }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const sup = SUPPLIERS.find((s) => s.id === r.supplierId)!;
  const today = r.when.toDateString() === DEMO_NOW.toDateString();
  const when = today ? `${t("orders.day.today").toLowerCase()} ${r.time ?? ""}`.trim() : fmtDate(r.when, { weekday: "short", month: "short", day: "numeric" });
  const params: Record<string, string | number> = { ...(r.detail.params as Record<string, string | number>) };
  if (typeof params.product === "string") params.product = loc(getProduct(params.product).name);
  return (
    <li className="flex items-start gap-3 border-b border-line py-[11px] last:border-0">
      <span className={`mt-[5px] size-2.5 shrink-0 rounded-full ${DOT[r.status]}`} />
      <div>
        <div className="font-semibold">
          {sup.name} · {r.status === "late" ? t("suppliers.recent.due", { when }) : when}
        </div>
        <div className="text-xs text-muted">{t(`suppliers.recent.${r.detail.key}`, params)}</div>
      </div>
    </li>
  );
}
