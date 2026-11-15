import { useState } from "react";
import { Link } from "react-router";
import { Banknote, Check, ChevronRight, PackageMinus, ShoppingBag, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import type { MissReason, OnlineDay, PrepItem } from "@/data/online";
import { getProduct } from "@/data/products";
import { getStoreDay } from "@/data/today";
import { BeforeAfterChart } from "@/components/ui/BeforeAfterChart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { Progress } from "@/components/ui/Progress";
import { Segmented } from "@/components/ui/Segmented";
import { fmtAmd, fmtDeltaPct, fmtDeltaPp, fmtNumber, fmtPercent } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { useParamText } from "@/pages/stockouts/shared";
import { usePrepText } from "./prepText";
import { prepRef, useOnlineState } from "./useOnlineState";

const th = "border-b border-line bg-subtle px-4 py-2.5 text-left align-bottom text-xs font-semibold leading-snug text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-3 align-middle first:pl-5 last:pr-5";

/** Where each cause of missing items is dealt with */
const REASON_LINK: Record<MissReason, string> = { shelfEmpty: "/stockouts", lateDelivery: "/suppliers", outOfStock: "/orders", damaged: "/write-offs" };
const REASON_COLOR: Record<MissReason, string> = { shelfEmpty: "#d63b3b", lateDelivery: "#e8a23a", outOfStock: "#8b7cf0", damaged: "#9aa0b4" };

/** docs/design-references/approved/09-online-orders.png, reworked in step 17 */
export function OnlinePage() {
  const { t } = useTranslation();
  const { store } = useDemo();
  const [day, setDay] = useState<OnlineDay>("today");
  const st = useOnlineState(store.id, day);
  const today = useOnlineState(store.id, "today");
  const kpis = getStoreDay(store.id).kpis.week;
  const complete = kpis.onlineComplete;
  const missingOrders = complete.total - complete.done;
  const missingPct = 100 - complete.value;
  const { now, prev } = kpis.sales;
  const salesDelta = Math.round(((now.onlineSales - prev.onlineSales) / prev.onlineSales) * 1000) / 10;
  const mw = st.data.missingWeek;
  const doneCount = st.day.prep.filter(st.prepDone).length;

  return (
    <>
      <PageHeader title={t("pages.onlineOrders.title")} subtitle={t("online.subtitle")} />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          icon={PackageMinus}
          iconTone="bad"
          label={t("online.kpi.missingOrders")}
          info={t("online.kpi.missingOrdersInfo")}
          value={fmtPercent(missingPct)}
          sub={t("online.kpi.missingOrdersSub", { count: missingOrders, total: complete.total, complete: fmtPercent(complete.value) })}
          delta={{ text: fmtDeltaPp(-complete.delta), tone: deltaTone(-complete.delta, false) }}
          foot={t("today.vs.week")}
        />
        <KpiCard
          icon={Banknote}
          iconTone="bad"
          label={t("online.kpi.lost")}
          info={t("online.kpi.lostInfo")}
          value={fmtAmd(mw.lost, { thousands: true })}
          sub={t("online.kpi.lostSub", { count: mw.items })}
          delta={{ text: fmtDeltaPct(mw.lostDelta), tone: deltaTone(mw.lostDelta, false) }}
          foot={t("today.vs.week")}
        />
        <KpiCard
          icon={TriangleAlert}
          iconTone={today.atRiskTotal ? "warn" : "good"}
          label={t("online.kpi.atRiskToday")}
          info={t("online.kpi.atRiskInfo")}
          value={t("online.kpi.ofOrders", { count: today.atRiskTotal, total: today.day.orders })}
          sub={today.atRiskTotal ? t("online.kpi.atRiskSub", { time: today.day.pickingStarts }) : t("online.kpi.allReady")}
        />
        <KpiCard
          icon={ShoppingBag}
          iconTone="info"
          label={t("online.kpi.sales")}
          info={t("online.kpi.salesInfo")}
          value={fmtAmd(now.onlineSales)}
          delta={{ text: fmtDeltaPct(salesDelta), tone: deltaTone(salesDelta, true) }}
          foot={t("today.vs.week")}
        />
      </section>

      <OftenMissing />

      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3.5 pt-[18px]">
          <div>
            <div className="text-base font-semibold">{t(`online.prep.title.${day}`, { time: st.day.pickingStarts })}</div>
            <div className="mt-0.5 text-[13px] text-muted">{t(`online.prep.subtitleSync.${day}`)}</div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {day === "today" && (
              <div className="text-right">
                <div className="mb-1.5 font-semibold">{t("today.tasks.progress", { done: doneCount, total: st.day.prep.length })}</div>
                <Progress value={(doneCount / st.day.prep.length) * 100} className="w-[146px]" />
              </div>
            )}
            <Segmented
              label={t("online.dayLabel")}
              value={day}
              onChange={setDay}
              options={[
                { value: "today", label: t("orders.day.today") },
                { value: "tomorrow", label: t("orders.day.tomorrow") },
              ]}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t("online.prep.col.product")}</th>
                <th className={`${th} text-right`}>{t("online.prep.col.needs")}</th>
                <th className={`${th} text-right`}>{t("online.prep.col.onShelf")}</th>
                <th className={`${th} text-right`}>{t("online.prep.col.backroom")}</th>
                <th className={th}>{t("online.prep.col.action")}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-0">
              {st.day.prep.map((p) => (
                <PrepRow key={p.id} item={p} day={day} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <Reasons />
        <BeforeAfterChart
          title={t("online.trend.title")}
          subtitle={t("online.trend.subtitle")}
          values={st.data.trend.values}
          before={st.data.trend.before}
          firstWeek={new Date(2026, 7, 17)}
          format={(v) => fmtNumber(v, 1)}
        />
      </section>
    </>
  );
}

function PrepRow({ item: p, day }: { item: PrepItem; day: OnlineDay }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const params = useParamText();
  const prepText = usePrepText();
  const { store } = useDemo();
  const st = useOnlineState(store.id, day);
  const product = getProduct(p.productId);
  const ref = prepRef(p);
  const task = st.actions.find(ref);
  const done = st.prepDone(p);

  return (
    <tr className={done ? "bg-good-bg/45" : ""}>
      <td className={td}>
        <div className="flex items-center gap-3">
          <ProductThumb emoji={product.emoji} />
          <div className="whitespace-nowrap font-semibold">{loc(product.name)}</div>
        </div>
      </td>
      <td className={`${td} text-right tabular-nums`}>
        <b>{fmtNumber(p.needs)}</b>
        <div className="whitespace-nowrap text-xs text-muted">{t("online.prep.inOrders", { count: p.inOrders })}</div>
      </td>
      <td className={`${td} text-right tabular-nums`}>{fmtNumber(p.onShelf)}</td>
      <td className={`${td} text-right tabular-nums`}>{fmtNumber(p.backroom)}</td>
      <td className={td}>
        <div className={`font-medium ${done ? "text-good" : ""}`}>
          {done && <Check className="mr-1 inline size-4" strokeWidth={3} />}
          {prepText(p)}
        </div>
        <div className={`text-xs ${done ? "text-good" : "text-muted"}`}>
          {done
            ? p.doneAt
              ? t("online.prep.doneAt", { time: p.doneAt })
              : t("today.tasks.doneNow")
            : p.note
              ? t(`online.prep.note.${p.note.key}`, params(p.note.params))
              : day === "today"
                ? t("stockouts.table.onList")
                : ""}
        </div>
      </td>
      <td className={`${td} text-right`}>
        {done ? (
          !p.doneAt && (
            <button className="text-xs font-semibold text-muted hover:text-ink" onClick={() => st.actions.complete(ref, false)}>
              {t("online.prep.undo")}
            </button>
          )
        ) : day === "today" ? (
          // Today's items are already on "My store today"
          <Button onClick={() => st.actions.complete(ref)}>{t("today.tasks.markDone")}</Button>
        ) : task ? (
          <Pill tone="good">{t("online.often.added")}</Pill>
        ) : (
          <Button variant="soft" onClick={() => st.actions.add(ref)}>
            {t("online.often.add")}
          </Button>
        )}
      </td>
    </tr>
  );
}

/** Main table: products most often missing from online orders, by lost sales. */
function OftenMissing() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const params = useParamText();
  const { store } = useDemo();
  const st = useOnlineState(store.id, "today");
  const rows = [...st.data.often].sort((a, b) => b.lost - a.lost);
  const total = rows.reduce((s, o) => s + o.lost, 0);

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="px-5 pb-3.5 pt-[18px]">
        <div className="text-base font-semibold">{t("online.often.title")}</div>
        <div className="mt-0.5 text-[13px] text-muted">{t("online.often.subtitleLost", { count: rows.length, total: fmtAmd(total, { thousands: true }), all: fmtAmd(st.data.reasons.reduce((n, r) => n + r.lost, 0), { thousands: true }) })}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              <th className={th}>{t("online.often.col.product")}</th>
              <th className={`${th} text-right`}>{t("online.often.col.orders")}</th>
              <th className={`${th} text-right`}>{t("online.often.col.lost")}</th>
              <th className={th}>{t("online.often.col.reason")}</th>
              <th className={th}>{t("online.often.col.suggestion")}</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="[&_tr:last-child_td]:border-0">
            {rows.map((o) => {
              const p = getProduct(o.productId);
              const ref = o.task ? { task: o.task } : undefined;
              const added = ref && st.actions.find(ref);
              return (
                <tr key={o.productId}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <ProductThumb emoji={p.emoji} />
                      <div className="whitespace-nowrap font-semibold">{loc(p.name)}</div>
                    </div>
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    <b>{fmtNumber(o.orders)}</b>
                    <div className="whitespace-nowrap text-xs text-muted">{t("online.often.ordersUnit", { count: o.orders })}</div>
                  </td>
                  <td className={`${td} whitespace-nowrap text-right font-semibold tabular-nums`}>{fmtAmd(o.lost, { thousands: true })}</td>
                  <td className={td}>{t(`online.often.reason.${o.reason}`)}</td>
                  <td className={`${td} font-medium`}>{t(`online.often.suggestion.${o.suggestion.key}`, params(o.suggestion.params))}</td>
                  <td className={`${td} text-right`}>
                    {o.handled ? (
                      <Pill tone="good">{t("online.often.inOrderSuggestions")}</Pill>
                    ) : added ? (
                      <Pill tone="good">{t("online.often.added")}</Pill>
                    ) : (
                      ref && (
                        <Button variant="soft" onClick={() => st.actions.add(ref)}>
                          {t("online.often.add")}
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Why items went missing (last 4 weeks), each cause linking to the page that deals with it. */
function Reasons() {
  const { t } = useTranslation();
  const { store } = useDemo();
  const st = useOnlineState(store.id, "today");
  const reasons = st.data.reasons;
  const total = reasons.reduce((s, r) => s + r.lost, 0);
  const max = Math.max(...reasons.map((r) => r.lost));

  return (
    <Card>
      <div className="px-5 pt-[18px]">
        <div className="text-base font-semibold">{t("online.reasons.title")}</div>
        <div className="mt-0.5 text-[13px] text-muted">{t("online.reasons.subtitle", { total: fmtAmd(total, { thousands: true }) })}</div>
      </div>
      <ul className="px-3 pb-3 pt-2">
        {reasons.map((r) => (
          <li key={r.key}>
            <Link to={REASON_LINK[r.key]} className="group grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2.5 hover:bg-subtle">
              <span className="font-medium">{t(`online.reasons.${r.key}`)}</span>
              <span className="whitespace-nowrap text-right font-semibold tabular-nums">
                {fmtPercent((r.lost / total) * 100, 0)} <span className="font-normal text-muted">· {fmtAmd(r.lost, { thousands: true })}</span>
              </span>
              <ChevronRight className="size-4 text-faint group-hover:text-primary" />
              <span className="col-span-3 h-2 rounded-full bg-[#eeeef4]">
                <span className="block h-full rounded-full" style={{ width: `${(r.lost / max) * 100}%`, background: REASON_COLOR[r.key] }} />
              </span>
              <span className="col-span-3 text-xs text-muted">{t(`online.reasons.link.${r.key}`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
