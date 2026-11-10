import { useNavigate } from "react-router";
import { ArrowRight, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { useOrders, type OrderView } from "@/app/useOrders";
import { useTasks } from "@/app/useTasks";
import { DEMO_NOW } from "@/data/world";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Progress } from "@/components/ui/Progress";
import { useLocalized } from "@/lib/useLocalized";
import { SupplierTile, hoursUntil, shortDate, useDayLabel } from "./shared";

/** docs/design-references/approved/02-orders-to-place.png */
export function OrdersListPage() {
  const { t } = useTranslation();
  const { store, howItWorksDismissed, dismissHowItWorks } = useDemo();
  const orders = useOrders(store.id);

  const open = orders.filter((o) => o.stage !== "placed").sort((a, b) => a.order.deadline.getTime() - b.order.deadline.getTime());
  const dueToday = open.filter((o) => o.dueToday);
  const comingUp = open.filter((o) => !o.dueToday);
  const placed = orders.filter((o) => o.stage === "placed").sort((a, b) => a.order.delivery.getTime() - b.order.delivery.getTime());

  return (
    <>
      <PageHeader title={t("pages.orders.title")} subtitle={t("pages.orders.subtitle")} />

      {!howItWorksDismissed && (
        <Card className="mb-6 grid grid-cols-1 items-center gap-5 px-5 py-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-50 text-[13px] font-bold text-primary">{n}</span>
              <div>
                <div className="font-semibold">{t(`orders.how.${n}.title`)}</div>
                <div className="text-[13px] text-muted">{t(`orders.how.${n}.text`)}</div>
              </div>
            </div>
          ))}
          <Button onClick={dismissHowItWorks} className="justify-self-start md:justify-self-end">
            {t("orders.how.gotIt")}
          </Button>
        </Card>
      )}

      <Section label={t("orders.list.dueToday", { count: dueToday.length })} empty={t("orders.list.noneDueToday")} orders={dueToday} header />
      <Section label={t("orders.list.comingUp")} orders={comingUp} />
      <Section label={t("orders.list.placed")} orders={placed} />
    </>
  );
}

const COLS = "md:grid-cols-[minmax(0,30%)_18%_17%_minmax(0,1fr)_auto]";

function Section({ label, orders, empty, header }: { label: string; orders: OrderView[]; empty?: string; header?: boolean }) {
  const { t } = useTranslation();
  if (!orders.length && !empty) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2.5 ml-0.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted">{label}</h2>
      <Card className="divide-y divide-line overflow-hidden">
        {header && orders.length > 0 && (
          <div className={`hidden gap-3 bg-subtle px-5 py-2.5 text-xs font-semibold text-muted md:grid ${COLS}`}>
            <span>{t("orders.list.col.supplier")}</span>
            <span>{t("orders.list.col.orderBy")}</span>
            <span>{t("orders.list.col.delivery")}</span>
            <span>{t("orders.list.col.progress")}</span>
            <span />
          </div>
        )}
        {orders.length ? orders.map((o) => <OrderRow key={o.order.id} view={o} />) : <div className="px-5 py-4 text-muted">{empty}</div>}
      </Card>
    </section>
  );
}

function OrderRow({ view }: { view: OrderView }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const dayLabel = useDayLabel();
  const { store, setTaskDone } = useDemo();
  const { tasks } = useTasks(store.id);
  const { order, supplier, stage } = view;
  const placed = stage === "placed";
  const hours = hoursUntil(order.deadline);
  const callTask = tasks.find((x) => x.kind === "callSupplier" && x.supplierId === order.supplierId);
  const go = (step = "") => navigate(`/orders/${order.id}${step}`);

  const meta = placed
    ? t("orders.list.placedMeta", { date: shortDate(order.placedOn ?? DEMO_NOW), count: order.lines.length })
    : t("orders.list.meta", { categories: loc(supplier.categories), count: order.lines.length });

  return (
    <div className={`grid grid-cols-1 items-center gap-3 px-5 py-4 ${COLS}`}>
      <div className="flex min-w-0 items-center gap-3">
        <SupplierTile supplier={supplier} />
        <div className="min-w-0">
          <div className="font-semibold">{supplier.name}</div>
          <div className="truncate text-xs text-muted">{meta}</div>
        </div>
      </div>

      {placed ? (
        <>
          <div className="font-semibold">
            {order.late ? t("orders.list.wasDue", { date: shortDate(order.delivery) }) : t("orders.list.due", { when: dayLabel(order.delivery, order.deliveryTime, true) })}
          </div>
          <div>
            {order.late ? (
              <Pill tone="bad">{t("orders.list.daysLate", { count: order.late.daysLate })}</Pill>
            ) : (
              <Pill tone={view.placedNow ? "good" : "neutral"}>{t(view.placedNow ? "orders.list.placedNow" : "orders.list.onTheWay")}</Pill>
            )}
          </div>
          <div className="text-[13px] text-muted">{order.late ? t("orders.list.stockLeft", { count: order.late.daysOfStockLeft }) : ""}</div>
          <div className="md:text-right">
            {order.late && callTask && !callTask.done ? (
              <Button onClick={() => setTaskDone(callTask.id, true, "call")}>
                <Phone />
                {t("today.tasks.logCall")}
              </Button>
            ) : order.late && callTask?.done ? (
              <Pill tone="good">{t("orders.list.callLogged")}</Pill>
            ) : (
              <Button onClick={() => go("/done")}>{t("orders.list.viewOrder")}</Button>
            )}
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
