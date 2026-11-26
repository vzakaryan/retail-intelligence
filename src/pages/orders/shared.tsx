import { Check, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Supplier } from "@/data/types";
import { DEMO_NOW } from "@/data/world";
import { TONE } from "@/components/ui/tone";
import { fmtDate } from "@/lib/format";
import type { OrderView } from "@/app/useOrders";
import type { TaskRef } from "@/app/useTaskActions";
import { pick, initials } from "@/lib/names";
import { sectionOn } from "@/app/features";

export function SupplierTile({ supplier }: { supplier: Supplier }) {
  return <div className={`grid size-10 shrink-0 place-items-center rounded-ctl text-[13px] font-bold ${TONE[supplier.tone]}`}>{initials(supplier.name)}</div>;
}

const dayDiff = (a: Date, b: Date) =>
  Math.round((new Date(a.toDateString()).getTime() - new Date(b.toDateString()).getTime()) / 86_400_000);

/** "Today, 16:00" / "Tomorrow, 12:00" / "Thu, Nov 12" */
export function useDayLabel() {
  const { t } = useTranslation();
  /** `inline`: used mid-sentence, so "today"/"tomorrow" are lowercase */
  return (date: Date, time?: string, inline = false) => {
    const diff = dayDiff(date, DEMO_NOW);
    const rel = diff === 0 ? t("orders.day.today") : diff === 1 ? t("orders.day.tomorrow") : undefined;
    const day = rel ? (inline ? rel.toLowerCase() : rel) : fmtDate(date, { weekday: "short", month: "short", day: "numeric" });
    const hhmm = time ?? (date.getHours() || date.getMinutes() ? fmtDate(date, { hour: "2-digit", minute: "2-digit", hour12: false }) : undefined);
    return hhmm ? `${day}, ${hhmm}` : day;
  };
}

/** The "call the supplier about the delivery" task (same task as on Stockout risk / Suppliers). */
export const callRef = (supplierId: string, due: Date): TaskRef => ({
  task: { kind: "callSupplier", supplierId, params: { due, days: 2 }, tag: "supplier" },
  linked: { kind: "callSupplier", supplierId },
});

export const shortDate = (date: Date) => fmtDate(date, { weekday: "short", month: "short", day: "numeric" });

/** Hours from "now" in the demo until a deadline */
export const hoursUntil = (date: Date) => Math.round((date.getTime() - DEMO_NOW.getTime()) / 3_600_000);

/** Breadcrumb + title + subtitle + stepper shared by the steps of one order. */
export function OrderHeader({ view, step }: { view: OrderView; step: 1 | 2 | 3 | 4 }) {
  const { t } = useTranslation();
  const dayLabel = useDayLabel();
  const o = view.order;
  const receiving = sectionOn("orderReceiving");
  // MVP: Review · Place · Placed (no "Received" step)
  const steps = [t("orders.steps.review"), t("orders.steps.place"), t("orders.steps.placed"), t("orders.steps.received")].slice(0, receiving ? 4 : 3);

  return (
    <>
      <nav className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-muted" aria-label="breadcrumb">
        <Link to="/orders" className="font-semibold text-primary hover:underline">
          {t("nav.items.orders")}
        </Link>
        <ChevronRight className="size-3.5" />
        {pick(view.supplier.name)}
      </nav>
      <h1 className="text-[26px] font-bold leading-tight tracking-tight">{t("orders.order.title", { supplier: pick(view.supplier.name) })}</h1>
      <p className="mt-1 text-[15px] text-muted">
        {view.receipt ? (
          t("orders.order.subtitleReceived", { date: shortDate(view.receipt.on) })
        ) : view.stage === "placed" ? (
          receiving ? t("orders.order.subtitleCheck", { date: shortDate(view.checkOn!) }) : t("orders.order.subtitleDelivery", { date: dayLabel(o.delivery, o.deliveryTime, true) })
        ) : (
          <>
            {t("orders.order.orderBy")} <b className={hoursUntil(o.deadline) < 6 ? "text-bad" : "text-ink"}>{dayLabel(o.deadline, undefined, true)}</b>
            {" · "}
            {t("orders.order.subtitle", { delivery: dayLabel(o.delivery, o.deliveryTime, true), until: shortDate(o.coversUntil) })}
          </>
        )}
      </p>

      <ol className="mb-5 mt-[18px] flex flex-wrap items-center gap-3">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = n < step || (n === 4 && !!view.receipt);
          const on = n === step && !done;
          return (
            <li key={label} className="flex items-center gap-3">
              {i > 0 && <span className={`hidden h-0.5 w-14 sm:block ${n <= step ? "bg-good" : "bg-line"}`} />}
              <span className={`flex items-center gap-2 whitespace-nowrap font-semibold ${on || done ? "text-ink" : "text-muted"}`}>
                <span
                  className={`grid size-[26px] place-items-center rounded-full border-[1.5px] text-[13px] ${
                    done ? "border-good bg-good text-white" : on ? "border-primary bg-primary text-white" : "border-[#c9ccd8] bg-white"
                  }`}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
                </span>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
