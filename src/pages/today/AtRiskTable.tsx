import { Link } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RiskRow, StoreDay } from "@/data/today";
import { getProduct } from "@/data/products";
import { SUPPLIERS } from "@/data/world";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";

const th = "whitespace-nowrap border-b border-line bg-subtle px-4 py-2.5 text-left text-xs font-semibold text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-[13px] align-middle first:pl-5 last:pr-5";

export function AtRiskTable({ atRisk, refilled }: { atRisk: StoreDay["atRisk"]; refilled: Set<string> }) {
  const { t } = useTranslation();
  const loc = useLocalized();

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3.5 pt-[18px]">
        <div>
          <div className="text-base font-semibold">{t("today.atRisk.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("today.atRisk.subtitle")}</div>
        </div>
        <Link to="/stockouts" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
          {t("today.atRisk.seeAll", { count: atRisk.total })}
          <ArrowRight className="size-[15px]" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <th className={th}>{t("today.atRisk.col.product")}</th>
              <th className={`${th} text-right`}>{t("today.atRisk.col.onShelf")}</th>
              <th className={`${th} text-right`}>{t("today.atRisk.col.backroom")}</th>
              <th className={`${th} text-right`}>{t("today.atRisk.col.expected")}</th>
              <th className={th}>{t("today.atRisk.col.runsOut")}</th>
              <th className={th}>{t("today.atRisk.col.action")}</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child_td]:border-0">
            {atRisk.rows.map((row) => {
              const product = getProduct(row.productId);
              const done = refilled.has(row.productId);
              return (
                <tr key={row.productId} className={done ? "bg-good-bg/40" : ""}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <ProductThumb emoji={product.emoji} />
                      <div>
                        <div className="whitespace-nowrap font-semibold">{loc(product.name)}</div>
                        <div className="whitespace-nowrap text-xs text-muted">
                          {product.sku} · {SUPPLIERS.find((s) => s.id === product.supplierId)?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{fmtNumber(row.onShelf)}</td>
                  <td className={`${td} text-right tabular-nums`}>{fmtNumber(row.backroom)}</td>
                  <td className={`${td} text-right tabular-nums`}>{fmtNumber(row.expectedToday)}</td>
                  <td className={td}>
                    {done ? (
                      <Pill tone="good">{t("today.atRisk.refilled")}</Pill>
                    ) : (
                      <Pill tone={row.severity}>{t("today.atRisk.around", { time: row.runsOutAt })}</Pill>
                    )}
                  </td>
                  <td className={td}>{done ? <DoneAction /> : <ActionText row={row} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DoneAction() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-good">
      <Check className="size-4" />
      {t("today.atRisk.action.done")}
    </span>
  );
}

function ActionText({ row }: { row: RiskRow }) {
  const { t } = useTranslation();
  const a = row.action;
  const meta = (text: string) => <span className="text-xs text-muted"> · {text}</span>;

  if (a.kind === "refill")
    return (
      <span>
        {t("today.atRisk.action.refill")}
        {a.taskAdded && meta(t("today.atRisk.action.taskAdded"))}
      </span>
    );
  if (a.kind === "noneInBackroom")
    return (
      <span>
        {t("today.atRisk.action.noneInBackroom")}
        {meta(t("today.atRisk.action.nextSupplier", { supplier: SUPPLIERS.find((s) => s.id === a.supplierId)?.name }))}
      </span>
    );
  return (
    <span>
      {t("today.atRisk.action.nextDelivery", { time: a.time })}
      {meta(t("today.atRisk.action.askEarlier"))}
    </span>
  );
}
