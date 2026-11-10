import { useTranslation } from "react-i18next";
import type { SupplierStats } from "@/data/suppliers";
import { fmtNumber } from "@/lib/format";

/** "1.2 days", "1.5 hours", "35 min", or "—" */
export function useDelayText() {
  const { t } = useTranslation();
  return (s: SupplierStats) => (s.delay ? t(`suppliers.delay.${s.delay.unit}`, { value: fmtNumber(s.delay.value, s.delay.unit === "minutes" ? 0 : 1) }) : "—");
}

export const STATUS_TONE = { unreliable: "bad", watch: "warn", reliable: "good" } as const;
export const onTimeColor = (v: number) => (v >= 95 ? "#138a4b" : v >= 85 ? "#e09b2d" : "#d63b3b");
