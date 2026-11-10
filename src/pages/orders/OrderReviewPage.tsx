import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowRight, Check, CheckCheck, ChevronDown, ChevronUp, CircleCheck, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { useOrder, type LineView, type OrderView } from "@/app/useOrders";
import type { ChangeReason, LineReview } from "@/data/orders";
import { shortDate, OrderHeader } from "./shared";
import { useReasonText, useStatusText } from "./lineText";
import { ReasonDialog } from "./ReasonDialog";
import { WhyDrawer } from "./WhyDrawer";
import { OrderNotFound } from "./OrderNotFound";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { QtyInput } from "@/components/ui/QtyInput";
import { fmtAmd, fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { pick } from "@/lib/names";

const th = "whitespace-nowrap border-b border-line bg-subtle px-4 py-2.5 text-left text-xs font-semibold text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-3 align-middle first:pl-5 last:pr-5";

/** Step 1 of an order — docs/design-references/approved/03-order-review.png */
export function OrderReviewPage() {
  const { orderId } = useParams();
  const { store } = useDemo();
  const view = useOrder(store.id, orderId);
  if (!view) return <OrderNotFound />;
  if (view.stage === "placed") return <Navigate to={`/orders/${view.order.id}/done`} replace />;
  return <Review key={view.order.id} view={view} />;
}

function Review({ view }: { view: OrderView }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const { setLineReview, setLineReviews } = useDemo();
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [whyFor, setWhyFor] = useState<string>();
  const [asking, setAsking] = useState<{ productId: string; qty: number }>();
  const [showReviewed, setShowReviewed] = useState(false);

  const orderId = view.order.id;
  const toReview = view.lines.filter((l) => !l.review);
  const reviewed = view.lines.filter((l) => l.review);
  const qtyOf = (l: LineView) => drafts[l.product.id] ?? l.suggested;
  const reviewFor = (l: LineView, qty: number, reason?: ChangeReason): LineReview =>
    qty === l.suggested ? { status: qty === 0 ? "notNeeded" : "accepted", qty } : { status: "changed", qty, reason };

  const accept = (l: LineView) => {
    const qty = qtyOf(l);
    if (qty === l.suggested) setLineReview(orderId, l.product.id, reviewFor(l, qty));
    else setAsking({ productId: l.product.id, qty });
    setWhyFor(undefined);
  };
  const acceptAll = () => setLineReviews(orderId, Object.fromEntries(toReview.map((l) => [l.product.id, reviewFor(l, qtyOf(l))])));
  const edit = (l: LineView) => {
    setDrafts((d) => ({ ...d, [l.product.id]: l.review!.qty }));
    setLineReview(orderId, l.product.id, null);
  };
  const setQty = (productId: string, v: number) => setDrafts((d) => ({ ...d, [productId]: v }));

  const askingLine = asking && view.lines.find((l) => l.product.id === asking.productId);
  const whyLine = whyFor ? view.lines.find((l) => l.product.id === whyFor) : undefined;
  const allDone = toReview.length === 0;

  return (
    <>
      <OrderHeader view={view} step={1} />

      {allDone ? (
        <Card className="flex flex-wrap items-center gap-4 px-5 py-5">
          <IconTile icon={CircleCheck} tone="good" size="lg" />
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold">{t("orders.review.allDoneTitle", { count: view.lines.length })}</div>
            <div className="text-muted">{t("orders.review.allDoneText", { supplier: pick(view.supplier.name) })}</div>
          </div>
          <Button variant="primary" onClick={() => navigate(`/orders/${orderId}/place`)}>
            {t("orders.review.next")}
            <ArrowRight />
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3.5 pt-[18px]">
            <div>
              <div className="text-base font-semibold">{t("orders.review.needsReview", { count: toReview.length })}</div>
              <div className="mt-0.5 text-[13px] text-muted">{t("orders.review.needsReviewSub")}</div>
            </div>
            <Button onClick={acceptAll}>
              <CheckCheck />
              {t("orders.review.acceptAll", { count: toReview.length })}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  <th className={th}>{t("orders.review.col.product")}</th>
                  <th className={`${th} text-right`}>{t("orders.review.col.inStore")}</th>
                  <th className={`${th} text-right`}>{t("orders.review.col.expected", { day: shortDate(view.order.coversUntil).split(",")[0] })}</th>
                  <th className={`${th} text-right`}>{t("orders.review.col.suggested")}</th>
                  <th className={th}>{t("orders.review.col.yourQty")}</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="[&_tr:last-child_td]:border-0">
                {toReview.map((l) => (
                  <ReviewRow
                    key={l.product.id}
                    line={l}
                    qty={qtyOf(l)}
                    active={whyFor === l.product.id}
                    onQty={(v) => setQty(l.product.id, v)}
                    onWhy={() => setWhyFor(l.product.id)}
                    onAccept={() => accept(l)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {reviewed.length > 0 && (
        <Card className="mt-4">
          <button className="flex w-full items-center gap-3 px-5 py-4 text-left" onClick={() => setShowReviewed((s) => !s)} aria-expanded={showReviewed}>
            <IconTile icon={CircleCheck} tone="good" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{t("orders.review.reviewed", { count: reviewed.length })}</div>
              {!showReviewed && <ReviewedSummary lines={reviewed} />}
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
              {showReviewed ? t("common.hide") : t("common.show")}
              {showReviewed ? <ChevronUp className="size-[15px]" /> : <ChevronDown className="size-[15px]" />}
            </span>
          </button>
          {showReviewed && (
            <ul>
              {reviewed.map((l) => (
                <ReviewedRow key={l.product.id} line={l} onEdit={() => edit(l)} />
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card className="mt-5 flex flex-wrap items-center gap-3 px-5 py-4">
        <span>
          <b>{t("orders.review.progress", { done: view.reviewedCount, total: view.lines.length })}</b> · {t("orders.review.orderSoFar")}{" "}
          <b>{fmtAmd(view.value)}</b>
        </span>
        <span className="flex-1" />
        {!allDone && <span className="text-xs text-muted">{t("orders.review.moreToGo", { count: toReview.length })}</span>}
        <Button variant="primary" disabled={!allDone} onClick={() => navigate(`/orders/${orderId}/place`)}>
          {t("orders.review.next")}
          <ArrowRight />
        </Button>
      </Card>

      <WhyDrawer
        view={view}
        line={whyLine}
        qty={whyLine ? qtyOf(whyLine) : 0}
        onQty={(v) => whyLine && setQty(whyLine.product.id, v)}
        onAccept={() => whyLine && accept(whyLine)}
        onClose={() => setWhyFor(undefined)}
      />

      <ReasonDialog
        key={asking?.productId}
        open={!!asking}
        productName={askingLine ? loc(askingLine.product.name) : ""}
        suggested={askingLine?.suggested ?? 0}
        qty={asking?.qty ?? 0}
        onCancel={() => setAsking(undefined)}
        onSave={(reason) => {
          if (askingLine && asking) setLineReview(orderId, askingLine.product.id, reviewFor(askingLine, asking.qty, reason));
          setAsking(undefined);
        }}
      />
    </>
  );
}

function ReviewRow(props: { line: LineView; qty: number; active: boolean; onQty: (v: number) => void; onWhy: () => void; onAccept: () => void }) {
  const { line: l, qty, active, onQty, onWhy, onAccept } = props;
  const { t } = useTranslation();
  const loc = useLocalized();
  const reason = useReasonText();

  return (
    <tr className={active ? "bg-primary-50" : ""}>
      <td className={td}>
        <div className="flex items-center gap-3">
          <ProductThumb emoji={l.product.emoji} />
          <div>
            <div className="whitespace-nowrap font-semibold">{loc(l.product.name)}</div>
            <div className="text-xs text-muted">{l.product.sku}</div>
          </div>
        </div>
      </td>
      <td className={`${td} text-right tabular-nums`}>
        <div>{fmtNumber(l.line.inStore)}</div>
        {l.line.onTheWay > 0 && <div className="whitespace-nowrap text-xs text-muted">{t("orders.review.onTheWay", { count: l.line.onTheWay })}</div>}
      </td>
      <td className={`${td} text-right tabular-nums`}>{fmtNumber(l.line.expected)}</td>
      <td className={`${td} text-right`}>
        <div className="font-bold tabular-nums">{fmtNumber(l.suggested)}</div>
        <div className="ml-auto max-w-[190px] text-xs leading-snug text-muted">{reason(l)}</div>
      </td>
      <td className={td}>
        <QtyInput value={qty} onChange={onQty} changed={qty !== l.suggested} label={t("orders.review.qtyFor", { product: loc(l.product.name) })} />
      </td>
      <td className={`${td} whitespace-nowrap text-right`}>
        <button className="mr-3.5 text-[13px] font-semibold text-primary hover:underline" onClick={onWhy}>
          {t("orders.review.why")}
        </button>
        <Button onClick={onAccept} className="text-good">
          <Check />
          {qty === l.suggested ? t("orders.review.accept") : t("orders.review.save")}
        </Button>
      </td>
    </tr>
  );
}

function ReviewedSummary({ lines }: { lines: LineView[] }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const parts = lines.map((l) => {
    const name = loc(l.product.name).replace(/\s*\(.*\)$/, "");
    if (l.review!.status === "notNeeded") return t("orders.review.sumNotNeeded", { name });
    if (l.review!.status === "changed") return t("orders.review.sumChanged", { name, qty: l.review!.qty });
    return `${name} ${fmtNumber(l.review!.qty)}`;
  });
  return <div className="truncate text-xs text-muted">{parts.join(" · ")}</div>;
}

function ReviewedRow({ line: l, onEdit }: { line: LineView; onEdit: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const status = useStatusText()(l);
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3">
      <ProductThumb emoji={l.product.emoji} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{loc(l.product.name)}</div>
        {status.note && <div className="text-xs text-muted">{status.note}</div>}
      </div>
      <b className="w-14 text-right tabular-nums">{fmtNumber(l.review!.qty)}</b>
      <Pill tone={status.tone} className="w-[120px] text-center">
        {status.label}
      </Pill>
      <Button onClick={onEdit}>
        <Pencil />
        {t("common.edit")}
      </Button>
    </li>
  );
}
