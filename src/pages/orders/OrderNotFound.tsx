import { Link } from "react-router";
import { SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";

/** Shown when the order in the URL doesn't belong to the selected store. */
export function OrderNotFound() {
  const { t } = useTranslation();
  return (
    <Card className="grid place-items-center px-6 py-16 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-xl bg-neutral-bg text-muted">
        <SearchX className="size-6" />
      </div>
      <div className="text-base font-semibold">{t("orders.notFound.title")}</div>
      <p className="mt-1 max-w-sm text-muted">{t("orders.notFound.text")}</p>
      <Link to="/orders" className="mt-4 font-semibold text-primary hover:underline">
        {t("orders.notFound.back")}
      </Link>
    </Card>
  );
}
