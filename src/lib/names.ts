import i18n from "@/i18n";
import type { Localized } from "@/data/types";
import { SUPPLIERS } from "@/data/world";

/** Picks the current language from bilingual mock-data text (outside React hooks). */
export function pick(text: Localized): string {
  return (i18n.language === "hy" && text.hy) || text.en;
}

export function supplierName(id: string): string {
  const s = SUPPLIERS.find((x) => x.id === id);
  return s ? pick(s.name) : id;
}

/** Two-letter badge from a name: "Zov Water" → "ZW", "Hatseni" → "HA", "Աննա Մ." → "ԱՄ" */
export function initials(text: Localized): string {
  const words = pick(text).split(/\s+/).filter(Boolean);
  // One-word names ("Hatseni", "Կաթնաշխարհ") use their first two letters
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}
