import { useTranslation } from "react-i18next";
import type { ExpiryRow } from "@/data/expiry";
import { fmtDate } from "@/lib/format";

/** "today 20:00", "expired today", "Wed, Nov 11" */
export function useExpiresText() {
  const { t } = useTranslation();
  return (r: ExpiryRow) =>
    r.handled ? t("expiry.expires.expiredToday") : r.time ? t("expiry.expires.todayAt", { time: r.time }) : fmtDate(r.expires, { weekday: "short", month: "short", day: "numeric" });
}
