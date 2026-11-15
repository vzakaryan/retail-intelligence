import { useTranslation } from "react-i18next";
import { getImpact, type BeforeNow } from "@/data/impact";
import { Card } from "@/components/ui/Card";
import { InfoTip } from "@/components/ui/InfoTip";
import { fmtAmd, fmtDate, fmtPercent } from "@/lib/format";

/** "Your results so far": estimated impact since the store started using the product. */
export function ResultsCard({ storeId }: { storeId: string }) {
  const { t } = useTranslation();
  const im = getImpact(storeId);
  const since = fmtDate(im.goLive, { month: "short", day: "numeric" });
  const pct = (v: number) => fmtPercent(v);
  const amd = (v: number) => fmtAmd(v);

  // [label, values, format, lower is better]
  const rows: [string, BeforeNow, (v: number) => string, boolean][] = [
    [t("today.results.oosRate"), im.oosRate, pct, true],
    [t("today.results.lostSales"), im.lostSales, amd, true],
    [t("today.results.writeOffs"), im.writeOffs, amd, true],
    [t("today.results.excess"), im.excess, amd, true],
    [t("today.results.onlineComplete"), im.onlineComplete, pct, false],
  ];

  return (
    <Card>
      <div className="px-5 pt-[18px]">
        <div className="text-base font-semibold">{t("today.results.title")}</div>
        <div className="mt-0.5 text-[13px] text-muted">{t("today.results.since", { date: since, count: im.weeks })}</div>
      </div>

      {/* Headline: estimated impact */}
      <div className="mx-5 mt-3.5 rounded-ctl bg-good-bg px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
          {t("today.results.impact")}
          <InfoTip text={t("today.results.impactInfo")} />
        </div>
        <div className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-good">≈ {fmtAmd(im.total)}</div>
        <dl className="mt-2 space-y-1 text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-2">{t("today.results.recovered")}</dt>
            <dd className="font-semibold tabular-nums">{fmtAmd(im.recoveredSales)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-2">{t("today.results.avoided")}</dt>
            <dd className="font-semibold tabular-nums">{fmtAmd(im.writeOffsAvoided)}</dd>
          </div>
        </dl>
      </div>

      {/* Before → this week */}
      <table className="mt-2 w-full text-[13px]">
        <thead>
          <tr className="text-xs text-muted">
            <th className="py-2 pl-5 text-left font-medium" />
            <th className="px-2 py-2 text-right font-medium">{t("today.results.before")}</th>
            <th className="py-2 pr-5 text-right font-medium">{t("today.results.now")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, v, f, lowerBetter]) => {
            const better = lowerBetter ? v.now < v.before : v.now > v.before;
            return (
              <tr key={label} className="border-t border-line">
                <td className="py-2.5 pl-5 font-medium text-ink">{label}</td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-muted">{f(v.before)}</td>
                <td className={`whitespace-nowrap py-2.5 pr-5 text-right font-bold tabular-nums ${better ? "text-good" : "text-ink"}`}>{f(v.now)}</td>
              </tr>
            );
          })}
          <tr className="border-t border-line">
            <td className="py-2.5 pl-5 font-medium text-ink">{t("today.results.actedOn")}</td>
            <td className="px-2 py-2.5" />
            <td className="py-2.5 pr-5 text-right font-bold tabular-nums">{im.actedOnPct}%</td>
          </tr>
        </tbody>
      </table>
      <p className="px-5 pb-4 pt-1 text-xs text-muted">{t("today.results.note")}</p>
    </Card>
  );
}
