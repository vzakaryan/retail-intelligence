import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StoreDay } from "@/data/today";
import { getProduct } from "@/data/products";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { useLocalized } from "@/lib/useLocalized";

export function OnlineOrdersCard({ online, refilled }: { online: StoreDay["online"]; refilled: Set<string> }) {
  const { t } = useTranslation();
  const loc = useLocalized();

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 px-5 pt-[18px]">
        <div>
        <div className="text-base font-semibold">{t("today.online.title")}</div>
        <div className="mt-0.5 text-[13px] text-muted">{t("today.online.subtitle", { orders: online.orders, atRisk: online.atRisk })}</div>
        </div>
        <Link to="/online-orders" className="mt-0.5 shrink-0 text-primary hover:text-primary-600" aria-label={t("today.online.open")} title={t("today.online.open")}>
          <ArrowRight className="size-[18px]" />
        </Link>
      </div>
      <ul className="px-5 pb-4 pt-2">
        {online.items.map((item) => {
          const product = getProduct(item.productId);
          const done = refilled.has(item.productId);
          return (
            <li key={item.productId} className="flex items-center justify-between gap-3 border-b border-line py-[9px] last:border-0">
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumb emoji={product.emoji} size="sm" />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{loc(product.name)}</div>
                  <div className="text-xs text-muted">{t("today.online.meta", { orders: item.inOrders, onShelf: item.onShelf })}</div>
                </div>
              </div>
              {done ? (
                <Pill tone="good">{t("today.online.level.refilled")}</Pill>
              ) : (
                <Pill tone={item.level === "refill" ? "bad" : "warn"}>{t(`today.online.level.${item.level}`)}</Pill>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
