import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, Check, CircleCheck, Copy, Download, FileSpreadsheet, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/data/types";
import { useDemo } from "@/app/DemoContext";
import { daysBetween, isPlaced, useOrder } from "@/app/useOrders";
import { DEMO_NOW } from "@/data/world";
import { Segmented } from "@/components/ui/Segmented";
import { shortDate } from "./shared";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { useLocalized } from "@/lib/useLocalized";
import { OrderHeader } from "./shared";
import { OrderLinesCard } from "./OrderLinesCard";
import { OrderNotFound } from "./OrderNotFound";
import { downloadOrderSheet, orderAsText } from "./orderSheet";
import { pick } from "@/lib/names";
import { sectionOn } from "@/app/features";

/** Step 2 of an order — docs/design-references/approved/05-order-place.png */
export function OrderPlacePage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { store, markPlaced } = useDemo();
  const view = useOrder(store.id, orderId);
  const [copied, setCopied] = useState(false);
  const receiving = sectionOn("orderReceiving");
  // "Check delivery on": filled in from the supplier's usual delivery day for this order
  const usual = view ? Math.max(1, daysBetween(DEMO_NOW, view.order.delivery)) : 1;
  const [checkIn, setCheckIn] = useState<"1" | "2" | "pick">(usual === 1 ? "1" : usual === 2 ? "2" : "pick");
  const [picked, setPicked] = useState(() => toInput(addDays(DEMO_NOW, usual)));

  if (!view) return <OrderNotFound />;
  if (isPlaced(view)) return <Navigate to={`/orders/${view.order.id}/done`} replace />;
  if (view.stage !== "ready") return <Navigate to={`/orders/${view.order.id}`} replace />;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderAsText(t, loc, view, store));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  const checkOn = checkIn === "pick" ? fromInput(picked) : addDays(DEMO_NOW, Number(checkIn));
  const place = () => {
    markPlaced(view.order.id, checkOn);
    navigate(`/orders/${view.order.id}/done`);
  };

  return (
    <>
      <OrderHeader view={view} step={2} />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
        <OrderLinesCard
          view={view}
          action={
            <Link to={`/orders/${view.order.id}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary print:hidden">
              <ArrowLeft className="size-[15px]" />
              {t("orders.place.back")}
            </Link>
          }
        />

        <div className="flex flex-col gap-4 print:hidden">
          <Card>
            <div className="px-5 pt-[18px]">
              <div className="text-base font-semibold">{t("orders.place.sendTitle", { supplier: pick(view.supplier.name) })}</div>
              <div className="mt-0.5 text-[13px] text-muted">{t("orders.place.sendSub")}</div>
            </div>
            <div className="flex flex-col gap-2.5 px-5 pb-5 pt-4">
              <Option icon={FileSpreadsheet} tone="good" title={t("orders.place.excel")} text={t("orders.place.excelText")} end={Download} onClick={() => downloadOrderSheet(t, loc, view, store)} />
              <Option
                icon={copied ? Check : Copy}
                tone="info"
                title={copied ? t("orders.place.copied") : t("orders.place.copy")}
                text={t("orders.place.copyText")}
                end={Copy}
                onClick={copy}
              />
              <Option icon={Printer} tone="neutral" title={t("orders.place.print")} text={t("orders.place.printText")} end={Printer} onClick={() => window.print()} />
            </div>
          </Card>

          <Card className="px-5 pb-5 pt-[18px]">
            <div className="text-base font-semibold">{t("orders.place.confirmTitle")}</div>
            <div className="mt-0.5 text-[13px] text-muted">{t("orders.place.confirmSub")}</div>
            <ul className="mt-2.5 space-y-1.5 text-ink-2">
              {(receiving ? ["tasks", "late", "learn"] : ["tasks", "learn"]).map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <CircleCheck className="mt-0.5 size-[18px] shrink-0 text-good" />
                  {t(`orders.place.benefit.${k}`)}
                </li>
              ))}
            </ul>
            {receiving && <div className="mt-4 rounded-ctl border border-line bg-subtle px-3.5 py-3">
              <div className="font-semibold">{t("orders.place.checkOn")}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Segmented
                  label={t("orders.place.checkOn")}
                  value={checkIn}
                  onChange={setCheckIn}
                  options={[
                    { value: "1", label: t("orders.day.tomorrow") },
                    { value: "2", label: t("orders.place.in2days") },
                    { value: "pick", label: t("orders.place.pickDate") },
                  ]}
                />
                {checkIn === "pick" && (
                  <input
                    type="date"
                    value={picked}
                    min={toInput(DEMO_NOW)}
                    onChange={(e) => e.target.value && setPicked(e.target.value)}
                    aria-label={t("orders.place.pickDate")}
                    className="rounded-ctl border border-line bg-white px-2.5 py-1.5"
                  />
                )}
              </div>
              <p className="mt-2 text-xs text-muted">{t("orders.place.checkOnHint", { date: shortDate(checkOn) })}</p>
            </div>}
            <Button variant="primary" className="mt-4 w-full justify-center py-[11px] text-sm" onClick={place}>
              <Check />
              {t("orders.place.confirm", { supplier: pick(view.supplier.name) })}
            </Button>
            <p className="mt-2.5 text-center text-xs text-muted">{t("orders.place.partial")}</p>
          </Card>
        </div>
      </div>
    </>
  );
}

const addDays = (x: Date, n: number) => new Date(x.getFullYear(), x.getMonth(), x.getDate() + n);
const pad = (n: number) => String(n).padStart(2, "0");
/** Date ↔ "2026-11-12" for the date input (local time) */
const toInput = (x: Date) => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
const fromInput = (v: string) => {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
};

function Option({ icon, tone, title, text, end: End, onClick }: { icon: LucideIcon; tone: Tone; title: string; text: string; end: LucideIcon; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3.5 rounded-xl border border-line px-4 py-3.5 text-left transition-colors hover:border-primary-200 hover:bg-subtle">
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted">{text}</div>
      </div>
      <End className="size-[18px] text-faint" />
    </button>
  );
}
