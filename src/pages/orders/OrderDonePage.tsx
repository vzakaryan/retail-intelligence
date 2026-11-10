import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, CircleCheck, Clock, ListChecks, Phone, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { useOrder } from "@/app/useOrders";
import { useTasks } from "@/app/useTasks";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { Pill } from "@/components/ui/Pill";
import { OrderHeader, shortDate, useDayLabel } from "./shared";
import { OrderLinesCard } from "./OrderLinesCard";
import { OrderNotFound } from "./OrderNotFound";
import { pick } from "@/lib/names";

/** Step 3 (confirmation) and the view of an order that is already placed. */
export function OrderDonePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dayLabel = useDayLabel();
  const { orderId } = useParams();
  const { store, setTaskDone } = useDemo();
  const view = useOrder(store.id, orderId);
  const { tasks } = useTasks(store.id);
  if (!view) return <OrderNotFound />;
  if (view.stage !== "placed") return <Navigate to={`/orders/${view.order.id}`} replace />;

  const o = view.order;
  const callTask = o.late ? tasks.find((x) => x.kind === "callSupplier" && x.supplierId === o.supplierId) : undefined;

  return (
    <>
      <OrderHeader view={view} step={3} />

      <Card className="mb-4 flex flex-wrap items-center gap-4 px-5 py-5">
        <IconTile icon={o.late ? Clock : view.placedNow ? CircleCheck : Truck} tone={o.late ? "bad" : "good"} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold">
            {view.placedNow ? t("orders.done.placedTitle", { supplier: pick(view.supplier.name) }) : t("orders.done.placedBefore", { date: shortDate(o.placedOn!) })}
          </div>
          <div className="text-muted">
            {o.late
              ? t("orders.done.lateText", { date: shortDate(o.delivery), count: o.late.daysOfStockLeft })
              : t("orders.done.deliveryText", { delivery: dayLabel(o.delivery, o.deliveryTime) })}
          </div>
        </div>
        {o.late ? (
          callTask?.done ? (
            <Pill tone="good">{t("orders.list.callLogged")}</Pill>
          ) : (
            callTask && (
              <Button onClick={() => setTaskDone(callTask.id, true, "call")}>
                <Phone />
                {t("today.tasks.logCall")}
              </Button>
            )
          )
        ) : (
          <Pill tone={view.placedNow ? "good" : "neutral"}>{t(view.placedNow ? "orders.list.placedNow" : "orders.list.onTheWay")}</Pill>
        )}
      </Card>

      <OrderLinesCard view={view} />

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Button onClick={() => navigate("/orders")}>
          <ArrowLeft />
          {t("orders.done.backToOrders")}
        </Button>
        {view.placedNow && (
          <Button variant="primary" onClick={() => navigate("/today")}>
            <ListChecks />
            {t("orders.done.backToToday")}
          </Button>
        )}
      </div>
    </>
  );
}
