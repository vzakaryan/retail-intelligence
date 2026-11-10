import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hy from "./locales/hy.json";

/**
 * All UI text lives in ./locales/*.json — never hard-code strings in components.
 * Armenian (hy) mirrors en.json key by key; any missing key falls back to English.
 */
export const LANGUAGES = [
  { code: "en", label: "EN", locale: "en-US", ready: true },
  { code: "hy", label: "Հայ", locale: "hy-AM", ready: true },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "ri-lang";

/** Language shown to first-time visitors (the client is Armenian). */
const DEFAULT_LANGUAGE = "hy";

/** Remembered language for this browser (a per-viewer convenience; may be unavailable). */
function savedLanguage(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "hy" || v === "en" ? v : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* storage blocked — ignore */
  }
});

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hy: { translation: hy } },
  lng: savedLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function currentLocale(): string {
  return LANGUAGES.find((l) => l.code === i18n.language)?.locale ?? "en-US";
}

export default i18n;
