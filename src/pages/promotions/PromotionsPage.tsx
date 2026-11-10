import { useState } from "react";
import { BadgePercent, ChevronRight, ListChecks, Scale, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { getProduct } from "@/data/products";
import { getPromotions, type UpcomingPromo } from "@/data/promotions";
import { DEMO_NOW } from "@/data/world";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { fmtAmd, fmtDate, fmtNumber } from "@/lib/format";
import { PromoDrawer } from "./PromoDrawer";
import { usePromoDates } from "./shared";
import { usePromoReadiness } from "./usePromoReadiness";

const th = "whitespace-nowrap border-b border-line bg-subtle px-4 py-2.5 text-left text-xs font-semibold text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-3 align-middle first:pl-5 last:pr-5";
const shortDay = (d: Date) => fmtDate(d, { weekday: "short", month: "short", day: "numeric" });
const daysUntil = (d: Date) => Math.round((new Date(d.toDateString()).getTime() - new Date(DEMO_NOW.toDateString()).getTime()) / 86_400_000);

/** docs/design-references/approved/17-promotions.png */
export function PromotionsPage() {
  const { t } = useTranslation();
  const { store } = useDemo();
  const data = getPromotions(store.id);
  const ready = usePromoReadiness();
  const [open, setOpen] = useState<string>();
  const next = data.upcoming.find((p) => p.steps.length > 0) ?? data.upcoming[0];
  const nextReady = ready(next);
  const startingThisWeek = data.upcoming.filter((p) => daysUntil(p.from) <= 7).length;

  return (
    <>
      <PageHeader title={t("pages.promotions.title")} subtitle={t("promotions.subtitle")} />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={BadgePercent}
          iconTone="primary"
          label={t("promotions.kpi.running")}
          value={
            <>
              {fmtNumber(data.running.length)} <small className="ml-0.5 text-base font-semibold text-ink-2">{t("promotions.kpi.promotions", { count: data.running.length })}</small>
            </>
          }
          foot={t("promotions.kpi.startThisWeek", { count: startingThisWeek })}
        />
        <KpiCard icon={TrendingUp} iconTone="good" label={t("promotions.kpi.extra")} info={t("promotions.kpi.extraInfo")} value={fmtAmd(data.extraSalesWeek)} delta={{ text: `+${data.extraSalesPct}%`, tone: "good" }} foot={t("promotions.kpi.extraFoot")} />
        <KpiCard
          icon={ListChecks}
          iconTone={nextReady.done === nextReady.total ? "good" : "warn"}
          label={t("promotions.kpi.ready")}
          value={
            <>
              {nextReady.done} <small className="ml-0.5 text-base font-semibold text-ink-2">{t("promotions.kpi.ofSteps", { total: nextReady.total })}</small>
            </>
          }
          foot={t("promotions.kpi.readyFoot", { name: t(`promotions.name.${next.name.key}`, next.name.params), date: fmtDate(next.from, { weekday: "short" }) })}
        />
        <KpiCard
          icon={Scale}
          iconTone="info"
          label={t("promotions.kpi.paidOff")}
          info={t("promotions.kpi.paidOffInfo")}
          value={
            <>
              {data.paidOff.count} <small className="ml-0.5 text-base font-semibold text-ink-2">{t("promotions.kpi.of", { total: data.paidOff.total })}</small>
            </>
          }
          foot={t("promotions.kpi.paidOffFoot")}
        />
      </section>

      <Card className="mb-6 overflow-hidden">
        <div className="px-5 pb-3.5 pt-[18px]">
          <div className="text-base font-semibold">{t("promotions.upcoming.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("promotions.upcoming.subtitle")}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t("promotions.upcoming.promotion")}</th>
                <th className={th}>{t("promotions.upcoming.dates")}</th>
                <th className={th}>{t("promotions.upcoming.products")}</th>
                <th className={`${th} text-right`}>{t("promotions.upcoming.extra")}</th>
                <th className={th}>{t("promotions.upcoming.ready")}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-0">
              {data.upcoming.map((p) => (
                <UpcomingRow key={p.id} promo={p} active={open === p.id} onOpen={() => setOpen(p.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <div className="px-5 pt-[18px]">
            <div className="text-base font-semibold">{t("promotions.running.title")}</div>
            <div className="mt-0.5 text-[13px] text-muted">{t("promotions.running.subtitle")}</div>
          </div>
          <ul className="px-5 pb-3 pt-1">
            {data.running.map((r, i) => (
              <li key={i} className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-0">
                <div>
                  <div className="font-semibold">{t(`promotions.name.${r.name.key}`, r.name.params)}</div>
                  <div className="text-xs text-muted">
                    {t("promotions.running.until", { date: shortDay(r.until) })}
                    {r.note && (
                      <>
                        {" · "}
                        <span className={r.note.tone === "warn" ? "text-warn" : "text-good"}>{t(`promotions.running.note.${r.note.key}`)}</span>
                      </>
                    )}
                  </div>
                </div>
                <Pill tone="good">{t("promotions.running.uplift", { pct: r.upliftPct })}</Pill>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-5 pb-3.5 pt-[18px]">
            <div className="text-base font-semibold">{t("promotions.past.title")}</div>
            <div className="mt-0.5 text-[13px] text-muted">{t("promotions.past.subtitle")}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr>
                  <th className={th}>{t("promotions.upcoming.promotion")}</th>
                  <th className={`${th} text-right`}>{t("promotions.past.extra")}</th>
                  <th className={`${th} text-right`}>{t("promotions.past.cost")}</th>
                  <th className={th}>{t("promotions.past.result")}</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child_td]:border-0">
                {data.past.map((p, i) => {
                  const ok = p.extraSales > p.discountCost;
                  const [tone, key] = !ok ? (["bad", "no"] as const) : p.leftover ? (["warn", "leftover"] as const) : (["good", "yes"] as const);
                  return (
                    <tr key={i}>
                      <td className={td}>
                        <div className="font-semibold">{t(`promotions.name.${p.name.key}`, p.name.params)}</div>
                        <div className="text-xs text-muted">
                          {fmtDate(p.from, { month: "short", day: "numeric" })} – {fmtDate(p.to, { day: "numeric" })}
                        </div>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{fmtAmd(p.extraSales, { thousands: true })}</td>
                      <td className={`${td} text-right tabular-nums`}>{fmtAmd(p.discountCost, { thousands: true })}</td>
                      <td className={td}>
                        <Pill tone={tone}>{t(`promotions.past.${key}`)}</Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <PromoDrawer promo={data.upcoming.find((p) => p.id === open)} onClose={() => setOpen(undefined)} />
    </>
  );
}

function UpcomingRow({ promo: p, active, onOpen }: { promo: UpcomingPromo; active: boolean; onOpen: () => void }) {
  const { t } = useTranslation();
  const dates = usePromoDates();
  const r = usePromoReadiness()(p);
  const inDays = daysUntil(p.from);
  let pill: [string, "good" | "warn" | "neutral"];
  let meta: string;
  if (r.total > 0) {
    pill = [r.done === r.total ? t("promotions.upcoming.allReady") : t("promotions.upcoming.steps", { done: r.done, total: r.total }), r.done === r.total ? "good" : "warn"];
    meta = r.done === r.total ? t("promotions.upcoming.allDoneMeta") : t("promotions.upcoming.stepsLeft", { count: r.total - r.done });
  } else if (inDays > 7) {
    pill = [t("promotions.upcoming.startsIn", { count: inDays }), "neutral"];
    meta = t(`promotions.note.${p.note?.key ?? "remindLater"}`);
  } else {
    pill = [t("promotions.upcoming.nothing"), "good"];
    meta = p.note ? t(`promotions.note.${p.note.key}`) : "";
  }
  return (
    <tr className={`cursor-pointer ${active ? "bg-primary-50" : "hover:bg-subtle"}`} onClick={onOpen}>
      <td className={td}>
        <div className="whitespace-nowrap font-semibold">{t(`promotions.name.${p.name.key}`, p.name.params)}</div>
        <div className="text-xs text-muted">{t("promotions.upcoming.byHeadOffice")}</div>
      </td>
      <td className={`${td} whitespace-nowrap`}>{dates(p)}</td>
      <td className={`${td} whitespace-nowrap`}>
        <span className="text-lg tracking-[2px]" aria-hidden>
          {p.productIds.map((id) => getProduct(id).emoji).join("")}
        </span>{" "}
        <span className="text-xs text-muted">{t("promotions.upcoming.productCount", { count: p.productCount })}</span>
      </td>
      <td className={`${td} whitespace-nowrap text-right font-bold tabular-nums`}>{fmtAmd(p.extraSales)}</td>
      <td className={td}>
        <Pill tone={pill[1]}>{pill[0]}</Pill>
        {meta && <div className="mt-1 text-xs text-muted">{meta}</div>}
      </td>
      <td className={`${td} w-8`}>
        <ChevronRight className="size-[18px] text-faint" />
      </td>
    </tr>
  );
}
