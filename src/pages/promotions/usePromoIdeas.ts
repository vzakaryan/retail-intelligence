import { useTranslation } from "react-i18next";
import { useDemo, type PromoDecision, type RejectReason } from "@/app/DemoContext";
import { useTaskActions } from "@/app/useTaskActions";
import { getProduct } from "@/data/products";
import { getPromotions, type PromoIdea } from "@/data/promotions";
import { fmtAmd, fmtDate } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { stepRef } from "@/pages/stockouts/shared";

export type IdeaStatus = "suggested" | "sent" | "approved" | "rejected";

export interface IdeaView {
  idea: PromoIdea;
  status: IdeaStatus;
  rejectReason?: RejectReason;
  /** Approved by head office before the demo starts */
  approvedBefore: boolean;
}

/** Deal text: "−20%", "3 for 2", "2 for 1" */
export function useDeal() {
  const { t } = useTranslation();
  return (deal: { key: string; params?: Record<string, number> }) => t(`promotions.deal.${deal.key}`, deal.params);
}

const day = (x: Date) => fmtDate(x, { weekday: "short", month: "short", day: "numeric" });

/** Suggested promotions merged with what the store did in the demo, plus the actions. */
export function usePromoIdeas(storeId: string) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { promoDecisions, setPromoDecision } = useDemo();
  const actions = useTaskActions(storeId);
  const data = getPromotions(storeId);
  const key = (id: string) => `${storeId}:${id}`;

  const views: IdeaView[] = data.ideas.map((idea) => {
    const dec: PromoDecision | undefined = promoDecisions[key(idea.id)];
    if (idea.approvedOn) return { idea, status: "approved", approvedBefore: true };
    if (!dec) return { idea, status: "suggested", approvedBefore: false };
    return { idea, status: dec.status, rejectReason: dec.status === "rejected" ? dec.reason : undefined, approvedBefore: false };
  });

  /** Short text to paste into an email / Viber message to head office */
  const summary = (idea: PromoIdea) =>
    t("promotions.send.text", {
      product: loc(getProduct(idea.productId).name),
      cut: idea.cut,
      from: day(idea.from),
      to: day(idea.to),
      why: t(`promotions.why.${idea.reason.detail}`, idea.reason.params),
      units: idea.promoUnits - idea.normalUnits,
      sales: fmtAmd(idea.extraSales, { thousands: true }),
      cost: fmtAmd(idea.discountCost, { thousands: true }),
    });

  const send = async (idea: PromoIdea) => {
    try {
      await navigator.clipboard.writeText(summary(idea));
    } catch {
      /* clipboard may be blocked; the status still changes */
    }
    setPromoDecision(key(idea.id), { status: "sent" });
  };
  const approve = (idea: PromoIdea) => {
    setPromoDecision(key(idea.id), { status: "approved" });
    // The store's part goes on today's list (same task as on Overstock, so it's never doubled)
    for (const s of idea.steps) {
      const ref = s.kind === "add" ? stepRef(s) : undefined;
      if (ref) actions.add(ref);
    }
  };
  const reject = (idea: PromoIdea, reason?: RejectReason) => setPromoDecision(key(idea.id), { status: "rejected", reason });
  const reset = (idea: PromoIdea) => setPromoDecision(key(idea.id), null);

  return { data, views, send, approve, reject, reset };
}
