import { CircleDashed, PencilRuler } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import type { NavItem } from "@/app/navigation";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStoreLabel } from "@/lib/useStoreLabel";

/** Temporary page for modules that are not built yet. */
export function PlaceholderPage({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  const label = useStoreLabel();
  const { store } = useDemo();
  const approved = item.design === "approved";
  const Icon = approved ? PencilRuler : CircleDashed;

  return (
    <>
      <PageHeader
        title={t(`pages.${item.id}.title`)}
        subtitle={t(`pages.${item.id}.subtitle`, { store: label.full(store) })}
      />
      <Card className="grid place-items-center px-6 py-20 text-center">
        <div className={`mb-4 grid size-12 place-items-center rounded-xl ${approved ? "bg-primary-50 text-primary" : "bg-neutral-bg text-muted"}`}>
          <Icon className="size-6" />
        </div>
        <div className="text-base font-semibold">{t(approved ? "placeholder.approvedTitle" : "placeholder.plannedTitle")}</div>
        <p className="mt-1 max-w-md text-muted">{t(approved ? "placeholder.approvedText" : "placeholder.plannedText")}</p>
      </Card>
    </>
  );
}
