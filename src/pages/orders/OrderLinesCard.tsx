import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { OrderView } from "@/app/useOrders";
import { Card } from "@/components/ui/Card";
import { fmtAmd, fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";

/** The final list of what is being ordered. */
export function OrderLinesCard({ view, action }: { view: OrderView; action?: ReactNode }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const ordered = view.lines.filter((l) => (l.review?.qty ?? 0) > 0);
  const skipped = view.lines.filter((l) => l.review && l.review.qty === 0);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3.5 pt-[18px]">
        <div>
          <div className="text-base font-semibold">{t("orders.place.yourOrder", { count: ordered.length })}</div>
          <div className="mt-0.5 text-[13px] text-muted">
            {t("orders.place.summary", { units: fmtNumber(view.units), value: fmtAmd(view.value) })}
            {skipped.length > 0 && ` · ${t("orders.place.notNeeded", { names: skipped.map((l) => loc(l.product.name)).join(", ") })}`}
          </div>
        </div>
        {action}
      </div>
      <ul>
        {ordered.map((l) => (
          <li key={l.product.id} className="flex items-center justify-between gap-3 border-t border-line px-5 py-[9px]">
            <span>
              <span aria-hidden>{l.product.emoji}</span>&nbsp; {loc(l.product.name)}
              {l.review!.status === "changed" && <span className="text-xs text-muted"> · {t("orders.place.changedFrom", { qty: l.suggested })}</span>}
            </span>
            <b className="tabular-nums">{fmtNumber(l.review!.qty)}</b>
          </li>
        ))}
      </ul>
    </Card>
  );
}
