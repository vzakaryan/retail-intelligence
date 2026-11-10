import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hy from "./locales/hy.json";

/**
 * All UI text lives in ./locales/*.json — never hard-code strings in components.
 * Armenian (hy) is not translated yet; missing keys fall back to English.
 */
export const LANGUAGES = [
  { code: "en", label: "EN", locale: "en-US", ready: true },
  { code: "hy", label: "Հայ", locale: "hy-AM", ready: false },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hy: { translation: hy } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function currentLocale(): string {
  return LANGUAGES.find((l) => l.code === i18n.language)?.locale ?? "en-US";
}

export default i18n;
