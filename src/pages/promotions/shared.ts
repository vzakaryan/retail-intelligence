import { useTranslation } from "react-i18next";
import type { UpcomingPromo } from "@/data/promotions";
import { fmtDate } from "@/lib/format";

const day = (d: Date) => fmtDate(d, { weekday: "short", month: "short", day: "numeric" });

/** Promotion dates: "Fri, Nov 13 – Sun, Nov 15" or "Every day 19:00–21:00 from Mon, Nov 16" */
export function usePromoDates() {
  const { t } = useTranslation();
  return (p: UpcomingPromo) => (p.hours ? t("promotions.dates.daily", { hours: p.hours, from: day(p.from) }) : p.to ? `${day(p.from)} – ${day(p.to)}` : day(p.from));
}
