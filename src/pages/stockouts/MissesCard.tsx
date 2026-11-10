import { useTranslation } from "react-i18next";
import type { StoreStockouts } from "@/data/stockouts";
import { getProduct } from "@/data/products";
import { Card } from "@/components/ui/Card";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { fmtAmd } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { useParamText } from "./shared";

export function MissesCard({ data }: { data: StoreStockouts }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const params = useParamText();
  return (
    <Card className="flex flex-col">
      <div className="px-5 pt-[18px]">
        <div className="text-base font-semibold">{t("stockouts.misses.title")}</div>
        <div className="mt-0.5 text-[13px] text-muted">{t("stockouts.misses.subtitle")}</div>
      </div>
      <ul className="px-5 pb-3 pt-2">
        {data.misses.map((m) => {
          const p = getProduct(m.productId);
          return (
            <li key={m.productId} className="flex items-center justify-between gap-3 border-b border-line py-[9px] last:border-0">
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumb emoji={p.emoji} size="sm" />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{loc(p.name)}</div>
                  <div className="text-xs text-muted">{t(`stockouts.misses.${m.what.key}`, params(m.what.params))}</div>
                </div>
              </div>
              <b className="whitespace-nowrap">{fmtAmd(m.lost)}</b>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto border-t border-line px-5 py-3.5 text-[13px] text-muted">
        {t("stockouts.misses.total")} <b className="text-ink">{fmtAmd(data.missesTotal)}</b>
      </div>
    </Card>
  );
}
