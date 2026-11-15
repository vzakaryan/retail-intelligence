import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ChevronDown, ChevronUp, CircleHelp, Phone, Undo2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { useOrders, type OrderView } from "@/app/useOrders";
import { useTaskActions } from "@/app/useTaskActions";
import { DEMO_NOW } from "@/data/world";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Progress } from "@/components/ui/Progress";
import { useLocalized } from "@/lib/useLocalized";
import { ReceiveDialog, orderedLines } from "./ReceiveDialog";
import { SupplierTile, callRef, hoursUntil, shortDate, useDayLabel } from "./shared";
import { pick } from "@/lib/names";

/** docs/design-references/approved/02-orders-to-place.png (+ delivery check, step 16) */
export function OrdersListPage() {
  const { t } = useTranslation();
  const { store } = useDemo();
  const orders = useOrders(store.id);
  const [howOpen, setHowOpen] = useState(false);
  const [receivedOpen, setReceivedOpen] = useState(false);

  const byDeadline = (a: OrderView, b: OrderView) => a.order.deadline.getTime() - b.order.deadline.getTime();
  const byCheck = (a: OrderView, b: OrderView) => a.checkOn!.getTime() - b.checkOn!.getTime();
  const open = orders.filter((o) => o.stage !== "placed" && o.stage !== "received").sort(byDeadline);
  const dueToday = open.filter((o) => o.dueToday);
  const comingUp = open.filter((o) => !o.dueToday);
  const needsCheck = orders.filter((o) => o.needsCheck).sort(byCheck);
  const waiting = orders.filter((o) => o.stage === "placed" && !o.needsCheck).sort(byCheck);
  const received = orders.filter((o) => o.stage === "received");

  return (
    <>
      <PageHeader
        title={t("pages.orders.title")}
        subtitle={t("pages.orders.subtitle")}
        actions={
          <Button onClick={() => setHowOpen((v) => !v)} aria-expanded={howOpen}>
            <CircleHelp />
            {t("orders.how.link")}
          </Button>
        }
      />

      {howOpen && <HowItWorks onClose={() => setHowOpen(false)} />}

      <Section label={t("orders.list.dueToday", { count: dueToday.length })} empty={t("orders.list.noneDueToday")} header>
        {dueToday.map((o) => <OrderRow key={o.order.id} view={o} />)}
      </Section>
      <Section label={t("orders.list.comingUp")}>{comingUp.map((o) => <OrderRow key={o.order.id} view={o} />)}</Section>
      <Section label={t("orders.list.needsCheck", { count: needsCheck.length })} tone="warn">
        {needsCheck.map((o) => <PlacedRow key={o.order.id} view={o} />)}
      </Section>
      <Section label={t("orders.list.waiting")}>{waiting.map((o) => <PlacedRow key={o.order.id} view={o} />)}</Section>

      {received.length > 0 && (
        <section className="mb-6">
          <button
            className="mb-2.5 ml-0.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted hover:text-ink-2"
            onClick={() => setReceivedOpen((v) => !v)}
            aria-expanded={receivedOpen}
          >
            {t("orders.list.received", { count: received.length })}
            {receivedOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          {receivedOpen && <Card className="divide-y divide-line overflow-hidden">{received.map((o) => <ReceivedRow key={o.order.id} view={o} />)}</Card>}
        </section>
      )}
    </>
  );
}

/** The steps, behind the "How it works" button (was a strip at the top of the page). */
function HowItWorks({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Card className="mb-6 px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-base font-semibold">{t("orders.how.title")}</div>
        <button onClick={onClose} aria-label={t("common.close")} className="rounded-md p-1 text-muted hover:bg-canvas hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-start gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-50 text-[13px] font-bold text-primary">{n}</span>
            <div>
              <div className="font-semibold">{t(`orders.how.${n}.title`)}</div>
              <div className="text-[13px] text-muted">{t(`orders.how.${n}.text`)}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3.5 border-t border-line pt-3 text-[13px] text-muted">{t("orders.how.autoClose")}</p>
    </Card>
  );
}

const COLS = "md:grid-cols-[minmax(0,30%)_18%_17%_minmax(0,1fr)_auto]";
/** Placed orders: supplier · check day (+ note) · status · actions */
const PLACED_COLS = "md:grid-cols-[minmax(0,30%)_minmax(0,1fr)_auto_auto]";

function Section({ label, children, empty, header, tone }: { label: string; children: ReactNode[]; empty?: string; header?: boolean; tone?: "warn" }) {
  const { t } = useTranslation();
  if (!children.length && !empty) return null;
  return (
    <section className="mb-6">
      <h2 className={`mb-2.5 ml-0.5 text-xs font-semibold uppercase tracking-[0.06em] ${tone === "warn" ? "text-warn" : "text-muted"}`}>{label}</h2>
      <Card className="divide-y divide-line overflow-hidden">
        {header && children.length > 0 && (
          <div className={`hidden gap-3 bg-subtle px-5 py-2.5 text-xs font-semibold text-muted md:grid ${COLS}`}>
            <span>{t("orders.list.col.supplier")}</span>
            <span>{t("orders.list.col.orderBy")}</span>
            <span>{t("orders.list.col.delivery")}</span>
            <span>{t("orders.list.col.progress")}</span>
            <span />
          </div>
        )}
        {children.length ? children : <div className="px-5 py-4 text-muted">{empty}</div>}
      </Card>
    </section>
  );
}

function SupplierCell({ view, meta }: { view: OrderView; meta: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <SupplierTile supplier={view.supplier} />
      <div className="min-w-0">
        <div className="font-semibold">{pick(view.supplier.name)}</div>
        <div className="truncate text-xs text-muted">{meta}</div>
      </div>
    </div>
  );
}

/** An order still to review / place. */
function OrderRow({ view }: { view: OrderView }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const dayLabel = useDayLabel();
  const { order, supplier, stage } = view;
  const hours = hoursUntil(order.deadline);
  const go = (step = "") => navigate(`/orders/${order.id}${step}`);

  return (
    <div className={`grid grid-cols-1 items-center gap-3 px-5 py-4 ${COLS}`}>
      <SupplierCell view={view} meta={t("orders.list.meta", { categories: loc(supplier.categories), count: order.lines.length })} />
      <div>
        <div className="text-xs text-muted md:hidden">{t("orders.list.col.orderBy")}</div>
        <div className="font-semibold">{dayLabel(order.deadline)}</div>
        {view.dueToday && (
          <Pill tone={hours < 6 ? "bad" : "warn"} className="mt-1">
            {t("orders.list.inHours", { count: hours })}
          </Pill>
        )}
      </div>
      <div>
        <div className="text-xs text-muted md:hidden">{t("orders.list.col.delivery")}</div>
        {dayLabel(order.delivery, order.deliveryTime)}
      </div>
      <div>
        <div className="mb-1.5 font-semibold">
          {stage === "notStarted" ? t("orders.list.notStarted") : stage === "ready" ? t("orders.list.ready") : t("orders.list.reviewed", { done: view.reviewedCount, total: view.lines.length })}
        </div>
        <Progress value={(view.reviewedCount / view.lines.length) * 100} className="w-[146px]" />
      </div>
      <div className="md:text-right">
        {stage === "ready" ? (
          <Button variant="primary" onClick={() => go("/place")}>
            {t("orders.list.placeOrder")}
            <ArrowRight />
          </Button>
        ) : (
          <Button variant={view.dueToday && stage === "inReview" ? "primary" : "default"} onClick={() => go()}>
            {stage === "inReview" ? t("orders.list.continue") : t("orders.list.start")}
            <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}

/** A placed order: waiting for its check day, or the check day has come. */
function PlacedRow({ view }: { view: OrderView }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store, snooze } = useDemo();
  const actions = useTaskActions(store.id);
  const [receiving, setReceiving] = useState(false);
  const { order } = view;
  const ref = callRef(order.supplierId, view.checkOn!);
  const callDone = actions.find(ref)?.done;
  const suggestCall = view.checkOverdue > 0 || view.snoozed >= 2;

  return (
    <div className={`grid grid-cols-1 items-center gap-x-5 gap-y-3 px-5 py-4 ${PLACED_COLS}`}>
      <SupplierCell view={view} meta={t("orders.list.placedMeta", { date: shortDate(order.placedOn ?? DEMO_NOW), count: orderedLines(view).length || order.lines.length })} />
      <div>
        <div className="font-semibold">
          {view.needsCheck
            ? view.checkOverdue
              ? t("orders.list.checkWasDue", { date: shortDate(view.checkOn!) })
              : t("orders.list.checkToday")
            : t("orders.list.checkOn", { date: shortDate(view.checkOn!) })}
        </div>
        <div className="text-[13px] text-muted">
          {view.needsCheck && order.late ? t("orders.list.stockLeft", { count: order.late.daysOfStockLeft }) : view.snoozed > 0 ? t("orders.list.remindedCount", { count: view.snoozed }) : ""}
        </div>
      </div>
      <div>
        {view.needsCheck ? (
          view.checkOverdue ? (
            <Pill tone="bad">{t("orders.list.daysLate", { count: view.checkOverdue })}</Pill>
          ) : (
            <Pill tone="warn">{t("orders.list.checkNow")}</Pill>
          )
        ) : (
          <Pill tone={view.placedNow ? "good" : "neutral"}>{t(view.placedNow ? "orders.list.placedNow" : "orders.list.onTheWay")}</Pill>
        )}
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {view.needsCheck ? (
          <>
            {suggestCall &&
              (callDone ? (
                <Pill tone="good" className="self-center">
                  {t("orders.list.callLogged")}
                </Pill>
              ) : (
                <Button onClick={() => actions.complete(ref, true, "call")}>
                  <Phone />
                  {t("today.tasks.logCall")}
                </Button>
              ))}
            <Button onClick={() => snooze(order.id)}>{t("orders.list.notYet")}</Button>
            <Button variant="primary" onClick={() => setReceiving(true)}>
              {t("orders.list.receivedBtn")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="soft" onClick={() => setReceiving(true)}>
              {t("orders.list.receivedBtn")}
            </Button>
            <Button onClick={() => navigate(`/orders/${order.id}/done`)}>{t("orders.list.viewOrder")}</Button>
          </>
        )}
      </div>
      <ReceiveDialog view={view} open={receiving} onClose={() => setReceiving(false)} />
    </div>
  );
}

/** A received order in the folded "Received · last 7 days" section. */
function ReceivedRow({ view }: { view: OrderView }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setReceipt } = useDemo();
  const shortCount = Object.keys(view.receipt!.short).length;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
      <div className="min-w-[200px] flex-1">
        <SupplierCell view={view} meta={t("orders.list.receivedMeta", { date: shortDate(view.receipt!.on) })} />
      </div>
      {shortCount ? <Pill tone="warn">{t("orders.list.shortCount", { count: shortCount })}</Pill> : <Pill tone="good">{t("orders.list.allArrived")}</Pill>}
      <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-ink" onClick={() => setReceipt(view.order.id, null)}>
        <Undo2 className="size-3.5" />
        {t("today.tasks.undoShort")}
      </button>
      <Button onClick={() => navigate(`/orders/${view.order.id}/done`)}>{t("orders.list.viewOrder")}</Button>
    </div>
  );
}
