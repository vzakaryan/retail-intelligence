import { useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, CalendarCheck, CircleCheck, Clock, ListChecks, PackageCheck, Phone, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { isPlaced, useOrder } from "@/app/useOrders";
import { useTaskActions } from "@/app/useTaskActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { Pill } from "@/components/ui/Pill";
import { fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { OrderHeader, callRef, shortDate } from "./shared";
import { OrderLinesCard } from "./OrderLinesCard";
import { OrderNotFound } from "./OrderNotFound";
import { ReceiveDialog, orderedLines } from "./ReceiveDialog";
import { pick } from "@/lib/names";

/** Step 3 (placed, waiting for the delivery check) and step 4 (received). */
export function OrderDonePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const { store, snooze, setReceipt } = useDemo();
  const view = useOrder(store.id, orderId);
  const actions = useTaskActions(store.id);
  // "Some items short?" from today's task opens the dialog straight on the lines
  const [receiving, setReceiving] = useState<false | "ask" | "short">(params.get("receive") === "short" ? "short" : false);
  if (!view) return <OrderNotFound />;
  if (!isPlaced(view)) return <Navigate to={`/orders/${view.order.id}`} replace />;

  const o = view.order;
  const supplier = pick(view.supplier.name);
  const ref = callRef(o.supplierId, view.checkOn!);
  const callDone = actions.find(ref)?.done;
  const r = view.receipt;
  const shortCount = r ? Object.keys(r.short).length : 0;

  return (
    <>
      <OrderHeader view={view} step={4} />

      <Card className="mb-4 flex flex-wrap items-center gap-4 px-5 py-5">
        {r ? (
          <>
            <IconTile icon={PackageCheck} tone={shortCount ? "warn" : "good"} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold">{t("orders.done.receivedTitle", { supplier, date: shortDate(r.on) })}</div>
              <div className="text-muted">{shortCount ? t("orders.done.receivedShort", { count: shortCount }) : t("orders.done.receivedAll")}</div>
            </div>
            <Button onClick={() => setReceipt(o.id, null)}>
              <Undo2 />
              {t("today.tasks.undoShort")}
            </Button>
          </>
        ) : (
          <>
            <IconTile icon={view.checkOverdue ? Clock : view.placedNow ? CircleCheck : CalendarCheck} tone={view.checkOverdue ? "bad" : "good"} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold">
                {view.placedNow ? t("orders.done.placedTitle", { supplier }) : t("orders.done.placedBefore", { date: shortDate(o.placedOn!) })}
              </div>
              <div className="text-muted">
                {view.needsCheck
                  ? view.checkOverdue
                    ? o.late
                      ? t("orders.done.checkOverdueStock", { date: shortDate(view.checkOn!), count: o.late.daysOfStockLeft })
                      : t("orders.done.checkOverdue", { date: shortDate(view.checkOn!) })
                    : t("orders.done.checkToday")
                  : t("orders.done.checkOn", { date: shortDate(view.checkOn!) })}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {view.needsCheck && (view.checkOverdue > 0 || view.snoozed >= 2) &&
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
              {view.needsCheck && <Button onClick={() => snooze(o.id)}>{t("orders.list.notYet")}</Button>}
              <Button variant={view.needsCheck ? "primary" : "soft"} onClick={() => setReceiving("ask")}>
                {t("orders.list.receivedBtn")}
              </Button>
            </div>
          </>
        )}
      </Card>

      {r ? <ReceivedLines view={view} /> : <OrderLinesCard view={view} />}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Button onClick={() => navigate("/orders")}>
          <ArrowLeft />
          {t("orders.done.backToOrders")}
        </Button>
        {view.placedNow && !r && (
          <Button variant="primary" onClick={() => navigate("/today")}>
            <ListChecks />
            {t("orders.done.backToToday")}
          </Button>
        )}
      </div>

      {receiving && <ReceiveDialog key={receiving} view={view} open startShort={receiving === "short"} onClose={() => setReceiving(false)} />}
    </>
  );
}

/** Ordered vs. received for each product. */
function ReceivedLines({ view }: { view: NonNullable<ReturnType<typeof useOrder>> }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lines = orderedLines(view);
  const short = view.receipt!.short;

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pb-3.5 pt-[18px] text-base font-semibold">{t("orders.done.receivedLines", { count: lines.length })}</div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-t border-line bg-subtle px-5 py-2 text-xs font-semibold text-muted">
        <span>{t("orders.done.colProduct")}</span>
        <span className="text-right">{t("orders.done.colOrdered")}</span>
        <span className="text-right">{t("orders.done.colReceived")}</span>
      </div>
      <ul>
        {lines.map((l) => {
          const ordered = l.review!.qty;
          const got = short[l.product.id] ?? ordered;
          return (
            <li key={l.product.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-t border-line px-5 py-[9px]">
              <span>
                <span aria-hidden>{l.product.emoji}</span>&nbsp; {loc(l.product.name)}
              </span>
              <span className="text-right tabular-nums text-muted">{fmtNumber(ordered)}</span>
              <b className={`text-right tabular-nums ${got < ordered ? "text-warn" : "text-good"}`}>{fmtNumber(got)}</b>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
