import type { Localized } from "./types";

export interface Product {
  id: string;
  sku: string;
  name: Localized;
  /** Placeholder picture until real product images exist */
  emoji: string;
  supplierId: string;
  category: "dairy" | "eggs" | "bakery" | "beverages";
}

const p = (id: string, sku: string, name: string, emoji: string, supplierId: string, category: Product["category"]): Product => ({
  id,
  sku,
  name: { en: name },
  emoji,
  supplierId,
  category,
});

/** Assortment shared by all stores in the chain. */
export const PRODUCTS: Product[] = [
  p("milk32", "DAI-001", "Milk 3.2% (1L)", "🥛", "dairyco", "dairy"),
  p("milk25", "DAI-002", "Milk 2.5% (1L)", "🥛", "dairyco", "dairy"),
  p("milk15", "DAI-003", "Milk 1.5% (1L)", "🥛", "dairyco", "dairy"),
  p("kefir", "DAI-010", "Kefir (1L)", "🍶", "dairyco", "dairy"),
  p("matsun", "DAI-021", "Matsun (500g)", "🥣", "dairyco", "dairy"),
  p("tan", "DAI-030", "Tan (1L)", "🥛", "dairyco", "dairy"),
  p("yogurt", "YOG-002", "Yogurt (500g)", "🥣", "dairyco", "dairy"),
  p("sourcream", "SCR-040", "Sour cream (400g)", "🫙", "dairyco", "dairy"),
  p("butter", "BUT-100", "Butter (200g)", "🧈", "dairyco", "dairy"),
  p("cheese", "CHS-200", "Cheese (300g)", "🧀", "dairyco", "dairy"),
  p("cottage", "CTG-030", "Cottage cheese (400g)", "🥣", "dairyco", "dairy"),
  p("cream10", "CRM-010", "Cream 10% (500ml)", "🥛", "dairyco", "dairy"),
  p("lori", "CHS-310", "Lori cheese (300g)", "🧀", "dairyco", "dairy"),
  p("chanakh", "CHS-320", "Chanakh cheese (300g)", "🧀", "dairyco", "dairy"),
  p("eggs10", "EGG-010", "Eggs (10-pack)", "🥚", "agrieggs", "eggs"),
  p("cola15", "BEV-015", "Cola (1.5L)", "🥤", "bevco", "beverages"),
  p("bread600", "BRD-004", "Bread (white, 600g)", "🍞", "freshbake", "bakery"),
];

export function getProduct(id: string): Product {
  const found = PRODUCTS.find((x) => x.id === id);
  if (!found) throw new Error(`Unknown product ${id}`);
  return found;
}
