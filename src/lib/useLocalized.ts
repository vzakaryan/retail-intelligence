import { useTranslation } from "react-i18next";
import type { Localized } from "@/data/types";

/** Picks the right language from mock-data text, falling back to English. */
export function useLocalized() {
  const { i18n } = useTranslation();
  return (text: Localized): string => (i18n.language === "hy" && text.hy) || text.en;
}
