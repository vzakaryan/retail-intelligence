import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, Check, CircleCheck, Copy, Download, FileSpreadsheet, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/data/types";
import { useDemo } from "@/app/DemoContext";
import { useOrder } from "@/app/useOrders";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { useLocalized } from "@/lib/useLocalized";
import { OrderHeader } from "./shared";
import { OrderLinesCard } from "./OrderLinesCard";
import { OrderNotFound } from "./OrderNotFound";
import { downloadOrderSheet, orderAsText } from "./orderSheet";

/** Step 2 of an order — docs/design-references/approved/05-order-place.png */
export function OrderPlacePage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { store, markPlaced } = useDemo();
  const view = useOrder(store.id, orderId);
  const [copied, setCopied] = useState(false);

  if (!view) return <OrderNotFound />;
  if (view.stage === "placed") return <Navigate to={`/orders/${view.order.id}/done`} replace />;
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
  const place = () => {
    markPlaced(view.order.id);
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
              <div className="text-base font-semibold">{t("orders.place.sendTitle", { supplier: view.supplier.name })}</div>
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
              {["tasks", "late", "learn"].map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <CircleCheck className="mt-0.5 size-[18px] shrink-0 text-good" />
                  {t(`orders.place.benefit.${k}`)}
                </li>
              ))}
            </ul>
            <Button variant="primary" className="mt-4 w-full justify-center py-[11px] text-sm" onClick={place}>
              <Check />
              {t("orders.place.confirm", { supplier: view.supplier.name })}
            </Button>
            <p className="mt-2.5 text-center text-xs text-muted">{t("orders.place.partial")}</p>
          </Card>
        </div>
      </div>
    </>
  );
}

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
