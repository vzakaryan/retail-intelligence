import { useTranslation } from "react-i18next";
import type { StoreDay } from "@/data/today";
import { Card } from "@/components/ui/Card";
import { fmtPp, fmtSignedPct } from "@/lib/format";

export function ResultsCard({ results }: { results: StoreDay["results"] }) {
  const { t } = useTranslation();
  const rows: [string, string, boolean][] = [
    [t("today.results.availability"), fmtPp(results.availabilityPp), true],
    [t("today.results.lostSales"), fmtSignedPct(results.lostSalesPct), true],
    [t("today.results.writeOffs"), fmtSignedPct(results.writeOffsPct), true],
    [t("today.results.actedOn"), `${results.actedOnPct}%`, false],
  ];

  return (
    <Card>
      <div className="px-5 pt-[18px]">
        <div className="text-base font-semibold">{t("today.results.title")}</div>
        <div className="mt-0.5 text-[13px] text-muted">{t("today.results.subtitle")}</div>
      </div>
      <dl className="px-5 pb-4 pt-1.5">
        {rows.map(([label, value, good]) => (
          <div key={label} className="flex items-baseline justify-between border-b border-line py-2.5 last:border-0">
            <dt>{label}</dt>
            <dd className={`text-lg font-bold ${good ? "text-good" : ""}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
