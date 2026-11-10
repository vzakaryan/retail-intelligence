import { useState } from "react";
import { Check, CircleCheck, PackageMinus, ShoppingBag, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import type { OnlineDay, PrepItem } from "@/data/online";
import { getProduct } from "@/data/products";
import { getStoreDay } from "@/data/today";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { Progress } from "@/components/ui/Progress";
import { Segmented } from "@/components/ui/Segmented";
import { fmtDeltaPp, fmtNumber, fmtPercent } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { useParamText } from "@/pages/stockouts/shared";
import { SlotDrawer } from "./SlotDrawer";
import { usePrepText } from "./prepText";
import { prepRef, useOnlineState } from "./useOnlineState";

const th = "border-b border-line bg-subtle px-4 py-2.5 text-left align-bottom text-xs font-semibold leading-snug text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-3 align-middle first:pl-5 last:pr-5";

/** docs/design-references/approved/09-online-orders.png */
export function OnlinePage() {
  const { t } = useTranslation();
  const { store } = useDemo();
  const [day, setDay] = useState<OnlineDay>("today");
  const [slotId, setSlotId] = useState<string>();
  const st = useOnlineState(store.id, day);
  const week = getStoreDay(store.id).kpis.week.onlineComplete;
  const doneCount = st.day.prep.filter(st.prepDone).length;

  return (
    <>
      <PageHeader
        title={t("pages.onlineOrders.title")}
        subtitle={t("online.subtitle")}
        actions={
          <Segmented
            label={t("online.dayLabel")}
            value={day}
            onChange={(v) => {
              setDay(v);
              setSlotId(undefined);
            }}
            options={[
              { value: "today", label: t("orders.day.today") },
              { value: "tomorrow", label: t("orders.day.tomorrow") },
            ]}
          />
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ShoppingBag} iconTone="info" label={t(`online.kpi.orders.${day}`)} value={fmtNumber(st.day.orders)} delta={{ text: `+${st.day.vsLastWeek}`, tone: "neutral" }} foot={t(`online.kpi.vsLastWeek.${day}`)} />
        <KpiCard
          icon={TriangleAlert}
          iconTone={st.atRiskTotal ? "bad" : "good"}
          label={t("online.kpi.atRisk")}
          info={t("online.kpi.atRiskInfo")}
          value={
            <>
              {fmtNumber(st.atRiskTotal)} <small className="ml-0.5 text-base font-semibold text-ink-2">{t("online.kpi.ordersUnit", { count: st.atRiskTotal })}</small>
            </>
          }
          foot={st.atRiskTotal ? t("online.kpi.atRiskFoot") : t("online.kpi.allReady")}
        />
        <KpiCard icon={CircleCheck} iconTone="good" label={t("online.kpi.complete")} info={t("today.kpi.onlineInfo")} value={fmtPercent(week.value)} delta={{ text: fmtDeltaPp(week.delta), tone: deltaTone(week.delta, true) }} foot={t("today.kpi.onlineFoot", { done: week.done, total: week.total })} />
        <KpiCard icon={PackageMinus} iconTone="warn" label={t("online.kpi.missing")} value={fmtNumber(st.data.missingLastWeek.value)} delta={{ text: `${st.data.missingLastWeek.delta < 0 ? "↓" : "↑"} ${Math.abs(st.data.missingLastWeek.delta)}`, tone: deltaTone(st.data.missingLastWeek.delta, false) }} foot={t("online.kpi.missingFoot")} />
      </section>

      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3.5 pt-[18px]">
          <div>
            <div className="text-base font-semibold">{t(`online.prep.title.${day}`, { time: st.day.pickingStarts })}</div>
            <div className="mt-0.5 text-[13px] text-muted">{t("online.prep.subtitle")}</div>
          </div>
          <div className="text-right">
            <div className="mb-1.5 font-semibold">{t("today.tasks.progress", { done: doneCount, total: st.day.prep.length })}</div>
            <Progress value={(doneCount / st.day.prep.length) * 100} className="w-[146px]" />
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

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_1.9fr]">
        <Card>
          <div className="px-5 pt-[18px]">
            <div className="text-base font-semibold">{t(`online.slots.title.${day}`)}</div>
            <div className="mt-0.5 text-[13px] text-muted">{t("online.slots.subtitle")}</div>
          </div>
          <ul className="px-5 pb-2 pt-1.5">
            {st.day.slots.map((s) => {
              const open = st.openOrders(s).length;
              const max = Math.max(...st.day.slots.map((x) => x.orders));
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setSlotId(s.id)}
                    className={`-mx-2 grid w-[calc(100%+16px)] grid-cols-[92px_1fr_auto] items-center gap-3 rounded-lg border-b border-line px-2 py-[11px] text-left last:border-0 hover:bg-subtle ${slotId === s.id ? "bg-primary-50" : ""}`}
                  >
                    <span>
                      <span className="block whitespace-nowrap font-semibold">
                        {s.from}–{s.to}
                      </span>
                      <span className="text-xs text-muted">{t("online.slots.orders", { count: s.orders })}</span>
                    </span>
                    <span className="flex h-2.5 overflow-hidden rounded-full bg-[#eeeef4]" style={{ width: `${(s.orders / max) * 100}%` }}>
                      <i className="block h-full bg-primary-200" style={{ width: `${((s.orders - open) / s.orders) * 100}%` }} />
                      <i className="block h-full bg-bad" style={{ width: `${(open / s.orders) * 100}%` }} />
                    </span>
                    {open ? <Pill tone="bad">{t("online.slots.atRisk", { count: open })}</Pill> : <Pill tone="good">{t("online.slot.ready")}</Pill>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-4 border-t border-line px-5 py-3 text-[12.5px] text-ink-2">
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-primary-200" />{t("online.slot.ready")}</span>
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-bad" />{t("online.slots.legendRisk")}</span>
          </div>
        </Card>

        <OftenMissing />
      </section>

      <SlotDrawer slot={st.day.slots.find((s) => s.id === slotId)} day={day} onClose={() => setSlotId(undefined)} />
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
  const done = st.prepDone(p);
  const task = st.actions.find(prepRef(p));
  const ref = prepRef(p);

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
            : task
              ? t("stockouts.table.onList")
              : p.note
                ? t(`online.prep.note.${p.note.key}`, params(p.note.params))
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
        ) : (
          <Button onClick={() => st.actions.complete(ref)}>{t("today.tasks.markDone")}</Button>
        )}
      </td>
    </tr>
  );
}

function OftenMissing() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const params = useParamText();
  const { store } = useDemo();
  const st = useOnlineState(store.id, "today");
  return (
    <Card className="overflow-hidden">
      <div className="px-5 pb-3.5 pt-[18px]">
        <div className="text-base font-semibold">{t("online.often.title")}</div>
        <div className="mt-0.5 text-[13px] text-muted">{t("online.often.subtitle")}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr>
              <th className={th}>{t("online.often.col.product")}</th>
              <th className={th}>{t("online.often.col.reason")}</th>
              <th className={th}>{t("online.often.col.suggestion")}</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="[&_tr:last-child_td]:border-0">
            {st.data.often.map((o) => {
              const p = getProduct(o.productId);
              const ref = o.task ? { task: o.task } : undefined;
              const added = ref && st.actions.find(ref);
              return (
                <tr key={o.productId}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <ProductThumb emoji={p.emoji} />
                      <div>
                        <div className="font-semibold">{loc(p.name)}</div>
                        <div className="text-xs text-muted">{t("online.often.missingIn", { count: o.orders })}</div>
                      </div>
                    </div>
                  </td>
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
