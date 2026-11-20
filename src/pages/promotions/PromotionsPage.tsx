import { useState } from "react";
import { Boxes, ChevronRight, Scale, TrendingUp, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo, type RejectReason } from "@/app/DemoContext";
import { getProduct } from "@/data/products";
import { paidOff, type PastPromo, type PromoIdea } from "@/data/promotions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { fmtAmd, fmtDate, fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { supplierName } from "@/lib/names";
import { IdeaDrawer, PastDrawer } from "./PromoDrawer";
import { useDeal, usePromoIdeas, type IdeaView } from "./usePromoIdeas";

const th = "whitespace-nowrap border-b border-line bg-subtle px-4 py-2.5 text-left text-xs font-semibold text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-3 align-middle first:pl-5 last:pr-5";
const day = (x: Date) => fmtDate(x, { month: "short", day: "numeric" });

/** Promotions: suggested by the product, past ones found in till data (step 20). */
export function PromotionsPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const deal = useDeal();
  const { store } = useDemo();
  const p = usePromoIdeas(store.id);
  const [openIdea, setOpenIdea] = useState<string>();
  const [openPast, setOpenPast] = useState<string>();
  const [rejecting, setRejecting] = useState<PromoIdea>();

  const pending = p.views.filter((v) => v.status === "suggested" || v.status === "sent");
  const couldClear = pending.reduce((s, v) => s + v.idea.clears, 0);
  const paid = p.data.past.filter(paidOff).length;
  const running = p.data.runningNow.map((r) => `${loc(getProduct(r.productId).name).split(" (")[0]} ${deal(r.deal)}`).join(" · ");

  return (
    <>
      <PageHeader title={t("pages.promotions.title")} subtitle={t("promotions.subtitleNew")} />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Boxes}
          iconTone="warn"
          label={t("promotions.kpi.couldClear")}
          info={t("promotions.kpi.couldClearInfo")}
          value={fmtAmd(couldClear, { thousands: true })}
          sub={t("promotions.kpi.couldClearSub", { count: pending.length })}
        />
        <KpiCard
          icon={TrendingUp}
          iconTone="good"
          label={t("promotions.kpi.extra")}
          info={t("promotions.kpi.extraInfoTill")}
          value={fmtAmd(p.data.extraSalesWeek, { thousands: true })}
          sub={running}
          delta={{ text: `+${p.data.extraSalesPct}%`, tone: "good" }}
          foot={t("promotions.kpi.extraFoot")}
        />
        <KpiCard
          icon={Scale}
          iconTone="info"
          label={t("promotions.kpi.paidOff")}
          info={t("promotions.kpi.paidOffInfo")}
          value={t("promotions.kpi.ofTotal", { count: paid, total: p.data.past.length })}
          foot={t("promotions.kpi.paidOffFoot")}
        />
      </section>

      <Card className="mb-6 overflow-hidden">
        <div className="px-5 pb-3.5 pt-[18px]">
          <div className="text-base font-semibold">{t("promotions.ideas.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("promotions.ideas.subtitle")}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t("promotions.ideas.col.product")}</th>
                <th className={th}>{t("promotions.ideas.col.why")}</th>
                <th className={th}>{t("promotions.ideas.col.suggested")}</th>
                <th className={th}>{t("promotions.ideas.col.expected")}</th>
                <th className={`${th} text-right`}>{t("promotions.ideas.col.status")}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-0">
              {p.views.map((v) => (
                <IdeaRow key={v.idea.id} view={v} onOpen={() => setOpenIdea(v.idea.id)} onSend={() => p.send(v.idea)} onApprove={() => p.approve(v.idea)} onReject={() => setRejecting(v.idea)} onReset={() => p.reset(v.idea)} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 pb-3.5 pt-[18px]">
          <div className="text-base font-semibold">{t("promotions.past.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("promotions.past.subtitleTill")}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t("promotions.past.col.promo")}</th>
                <th className={th}>{t("promotions.past.col.dates")}</th>
                <th className={`${th} text-right`}>{t("promotions.past.col.lift")}</th>
                <th className={`${th} text-right`}>{t("promotions.past.col.extra")}</th>
                <th className={`${th} text-right`}>{t("promotions.past.col.cost")}</th>
                <th className={th}>{t("promotions.past.col.result")}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-0">
              {p.data.past.map((x) => (
                <PastRow key={x.id} promo={x} onOpen={() => setOpenPast(x.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <IdeaDrawer view={p.views.find((v) => v.idea.id === openIdea)} onClose={() => setOpenIdea(undefined)} actions={p} onReject={(idea) => setRejecting(idea)} />
      <PastDrawer promo={p.data.past.find((x) => x.id === openPast)} onClose={() => setOpenPast(undefined)} />
      {rejecting && (
        <RejectDialog
          product={loc(getProduct(rejecting.productId).name)}
          onCancel={() => setRejecting(undefined)}
          onSave={(reason) => {
            p.reject(rejecting, reason);
            setRejecting(undefined);
          }}
        />
      )}
    </>
  );
}

function IdeaRow({ view, onOpen, onSend, onApprove, onReject, onReset }: { view: IdeaView; onOpen: () => void; onSend: () => void; onApprove: () => void; onReject: () => void; onReset: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const i = view.idea;
  const product = getProduct(i.productId);
  const extraUnits = i.promoUnits - i.normalUnits;
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <tr className={`cursor-pointer ${view.status === "approved" ? "bg-good-bg/40" : view.status === "rejected" ? "opacity-60" : "hover:bg-subtle"}`} onClick={onOpen}>
      <td className={td}>
        <div className="flex items-center gap-3">
          <ProductThumb emoji={product.emoji} />
          <div>
            <div className="whitespace-nowrap font-semibold">
              {i.productCount ? t("promotions.ideas.andMore", { product: loc(product.name).split(" (")[0], count: i.productCount - 1 }) : loc(product.name)}
            </div>
            <div className="text-xs text-muted">{supplierName(product.supplierId)}</div>
          </div>
        </div>
      </td>
      <td className={td}>
        <Pill tone={i.reason.key === "demandPeak" ? "info" : i.reason.key === "slowSeller" ? "neutral" : "warn"}>{t(`promotions.reason.${i.reason.key}`)}</Pill>
        <div className="mt-1 max-w-[230px] text-xs text-muted">{t(`promotions.why.${i.reason.detail}`, i.reason.params)}</div>
      </td>
      <td className={td}>
        <div className="font-semibold">−{i.cut}%</div>
        <div className="whitespace-nowrap text-xs text-muted">
          {day(i.from)} – {day(i.to)}
        </div>
      </td>
      <td className={td}>
        <div className="font-semibold">
          {i.clears ? t("promotions.ideas.clears", { amount: fmtAmd(i.clears, { thousands: true }) }) : t("promotions.ideas.extraSales", { amount: fmtAmd(i.extraSales, { thousands: true }) })}
        </div>
        <div className="text-xs text-muted">{t("promotions.ideas.expectedMeta", { units: fmtNumber(extraUnits), cost: fmtAmd(i.discountCost, { thousands: true }) })}</div>
      </td>
      <td className={`${td} text-right`}>
        {view.status === "suggested" && (
          <div className="flex flex-col items-end gap-1.5">
            <Button variant="soft" onClick={stop(onSend)}>
              {t("promotions.action.send")}
            </Button>
            <div className="flex items-center gap-3">
              <button className="text-[13px] font-semibold text-primary hover:underline" onClick={stop(onApprove)}>
                {t("promotions.action.approve")}
              </button>
              <button className="text-[13px] font-semibold text-muted hover:text-ink" onClick={stop(onReject)}>
                {t("promotions.action.reject")}
              </button>
            </div>
          </div>
        )}
        {view.status === "sent" && (
          <div className="flex flex-col items-end gap-1.5">
            <Pill tone="warn">{t("promotions.status.sent")}</Pill>
            <div className="flex items-center gap-3">
              <button className="text-[13px] font-semibold text-primary hover:underline" onClick={stop(onApprove)}>
                {t("promotions.action.approved")}
              </button>
              <button className="text-[13px] font-semibold text-muted hover:text-ink" onClick={stop(onReject)}>
                {t("promotions.action.rejected")}
              </button>
            </div>
          </div>
        )}
        {view.status === "approved" && (
          <div>
            <Pill tone="good">{t("promotions.status.approved")}</Pill>
            <div className="mt-1 text-xs text-muted">{view.approvedBefore ? t("promotions.status.approvedBy", { date: day(i.approvedOn!) }) : t("promotions.status.onTasks")}</div>
          </div>
        )}
        {view.status === "rejected" && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Pill tone="neutral">{view.rejectReason ? t(`promotions.rejectReason.${view.rejectReason}`) : t("promotions.status.rejected")}</Pill>
            <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-ink" onClick={stop(onReset)}>
              <Undo2 className="size-3.5" />
              {t("today.tasks.undoShort")}
            </button>
          </div>
        )}
      </td>
      <td className={`${td} w-8`}>
        <ChevronRight className="size-[18px] text-faint" />
      </td>
    </tr>
  );
}

function PastRow({ promo: x, onOpen }: { promo: PastPromo; onOpen: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const deal = useDeal();
  const product = getProduct(x.productId);
  const ok = paidOff(x);
  return (
    <tr className="cursor-pointer hover:bg-subtle" onClick={onOpen}>
      <td className={td}>
        <div className="flex items-center gap-3">
          <ProductThumb emoji={product.emoji} />
          <div className="whitespace-nowrap font-semibold">
            {loc(product.name)} <span className="font-normal text-muted">· {deal(x.deal)}</span>
          </div>
        </div>
      </td>
      <td className={`${td} whitespace-nowrap`}>
        {day(x.from)} – {day(x.to)}
      </td>
      <td className={`${td} text-right font-semibold tabular-nums text-good`}>+{x.liftPct}%</td>
      <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{fmtAmd(x.extraSales, { thousands: true })}</td>
      <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{fmtAmd(x.discountCost, { thousands: true })}</td>
      <td className={td}>
        <Pill tone={ok ? "good" : "bad"}>{t(ok ? "promotions.past.paid" : "promotions.past.notPaid")}</Pill>
      </td>
      <td className={`${td} w-8`}>
        <ChevronRight className="size-[18px] text-faint" />
      </td>
    </tr>
  );
}

const REASONS: RejectReason[] = ["headOffice", "margin", "timing", "other"];

/** Why a suggestion was rejected — improves future suggestions. */
function RejectDialog({ product, onSave, onCancel }: { product: string; onSave: (r?: RejectReason) => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<RejectReason>();
  return (
    <Modal open onClose={onCancel} labelledBy="reject-title">
      <h2 id="reject-title" className="text-lg font-bold">
        {t("promotions.rejectDialog.title")}
      </h2>
      <p className="mt-1 text-muted">{t("promotions.rejectDialog.text", { product })}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {REASONS.map((r) => (
          <button
            key={r}
            onClick={() => setPicked(r)}
            className={`rounded-ctl border px-3 py-2.5 text-left font-medium transition-colors ${picked === r ? "border-primary bg-primary-50 text-primary" : "border-line hover:bg-canvas"}`}
          >
            {t(`promotions.rejectReason.${r}`)}
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={() => onSave(undefined)}>{t("orders.reasonDialog.skip")}</Button>
        <Button variant="primary" disabled={!picked} onClick={() => onSave(picked)}>
          {t("promotions.rejectDialog.save")}
        </Button>
      </div>
    </Modal>
  );
}
