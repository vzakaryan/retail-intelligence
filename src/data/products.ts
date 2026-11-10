import type { Localized } from "./types";

export interface Product {
  id: string;
  sku: string;
  name: Localized;
  /** Placeholder picture until real product images exist */
  emoji: string;
  supplierId: string;
  category: "dairy" | "eggs" | "bakery" | "beverages" | "frozen" | "dry";
  /** Purchase price per unit, AMD (used for order value) */
  price: number;
}

const p = (id: string, sku: string, name: string, emoji: string, supplierId: string, category: Product["category"], price: number): Product => ({
  id,
  sku,
  name: { en: name, hy: HY[id] },
  emoji,
  supplierId,
  category,
  price,
});

/** Armenian product names (as printed on Armenian shelf labels) */
const HY: Record<string, string> = {
  milk32: "Կաթ 3,2% (1 լ)",
  milk25: "Կաթ 2,5% (1 լ)",
  milk15: "Կաթ 1,5% (1 լ)",
  kefir: "Կեֆիր (1 լ)",
  matsun: "Մածուն (500 գ)",
  tan: "Թան (1 լ)",
  yogurt: "Յոգուրտ (500 գ)",
  sourcream: "Թթվասեր (400 գ)",
  butter: "Կարագ (200 գ)",
  cheese: "Պանիր (300 գ)",
  cottage: "Կաթնաշոռ (400 գ)",
  cream10: "Սերուցք 10% (500 մլ)",
  lori: "Լոռի պանիր (300 գ)",
  chanakh: "Չանախ պանիր (300 գ)",
  eggs10: "Ձու (10 հատ)",
  eggs6: "Ձու (6 հատ)",
  eggs30: "Ձու (30 հատ)",
  cola15: "Կոլա (1,5 լ)",
  cola05: "Կոլա (0,5 լ)",
  water15: "Չգազավորված ջուր (1,5 լ)",
  sparkling: "Գազավորված ջուր (1 լ)",
  ojuice: "Նարնջի հյութ (1 լ)",
  ajuice: "Խնձորի հյութ (1 լ)",
  lemonade: "Լիմոնադ (1 լ)",
  icetea: "Սառը թեյ (1 լ)",
  energy: "Էներգետիկ ըմպելիք (0,25 լ)",
  bread600: "Սպիտակ հաց (600 գ)",
  rye: "Տարեկանի հաց (500 գ)",
  lavash: "Լավաշ (տուփ)",
  matnakash: "Մատնաքաշ (500 գ)",
  croissant: "Կրուասան",
  buns: "Բուլկի (6 հատ)",
  olive: "Ձիթապտղի յուղ (1 լ)",
  coffee: "Սուրճ (250 գ)",
  cornflakes: "Եգիպտացորենի փաթիլներ (500 գ)",
  pasta: "Մակարոն (500 գ)",
  icecream: "Պաղպաղակ (1 լ)",
};

/** Assortment shared by all stores in the chain. */
export const PRODUCTS: Product[] = [
  // DairyCo
  p("milk32", "DAI-001", "Milk 3.2% (1L)", "🥛", "dairyco", "dairy", 520),
  p("milk25", "DAI-002", "Milk 2.5% (1L)", "🥛", "dairyco", "dairy", 490),
  p("milk15", "DAI-003", "Milk 1.5% (1L)", "🥛", "dairyco", "dairy", 470),
  p("kefir", "DAI-010", "Kefir (1L)", "🍶", "dairyco", "dairy", 600),
  p("matsun", "DAI-021", "Matsun (500g)", "🥣", "dairyco", "dairy", 550),
  p("tan", "DAI-030", "Tan (1L)", "🥛", "dairyco", "dairy", 450),
  p("yogurt", "YOG-002", "Yogurt (500g)", "🥣", "dairyco", "dairy", 700),
  p("sourcream", "SCR-040", "Sour cream (400g)", "🫙", "dairyco", "dairy", 900),
  p("butter", "BUT-100", "Butter (200g)", "🧈", "dairyco", "dairy", 1900),
  p("cheese", "CHS-200", "Cheese (300g)", "🧀", "dairyco", "dairy", 2400),
  p("cottage", "CTG-030", "Cottage cheese (400g)", "🥣", "dairyco", "dairy", 1100),
  p("cream10", "CRM-010", "Cream 10% (500ml)", "🥛", "dairyco", "dairy", 1000),
  p("lori", "CHS-310", "Lori cheese (300g)", "🧀", "dairyco", "dairy", 1700),
  p("chanakh", "CHS-320", "Chanakh cheese (300g)", "🧀", "dairyco", "dairy", 1800),
  // AgriEggs
  p("eggs10", "EGG-010", "Eggs (10-pack)", "🥚", "agrieggs", "eggs", 950),
  p("eggs6", "EGG-006", "Eggs (6-pack)", "🥚", "agrieggs", "eggs", 600),
  p("eggs30", "EGG-030", "Eggs (30-pack)", "🥚", "agrieggs", "eggs", 2700),
  // BevCo
  p("cola15", "BEV-015", "Cola (1.5L)", "🥤", "bevco", "beverages", 520),
  p("cola05", "BEV-005", "Cola (0.5L)", "🥤", "bevco", "beverages", 300),
  p("water15", "BEV-101", "Still water (1.5L)", "💧", "bevco", "beverages", 220),
  p("sparkling", "BEV-110", "Sparkling water (1L)", "💧", "bevco", "beverages", 280),
  p("ojuice", "BEV-201", "Orange juice (1L)", "🧃", "bevco", "beverages", 750),
  p("ajuice", "BEV-202", "Apple juice (1L)", "🧃", "bevco", "beverages", 700),
  p("lemonade", "BEV-301", "Lemonade (1L)", "🍋", "bevco", "beverages", 450),
  p("icetea", "BEV-310", "Iced tea (1L)", "🧋", "bevco", "beverages", 480),
  p("energy", "BEV-401", "Energy drink (0.25L)", "⚡", "bevco", "beverages", 550),
  // FreshBake
  p("bread600", "BRD-004", "Bread (white, 600g)", "🍞", "freshbake", "bakery", 350),
  p("rye", "BRD-010", "Bread (rye, 500g)", "🍞", "freshbake", "bakery", 450),
  p("lavash", "BRD-020", "Lavash (pack)", "🫓", "freshbake", "bakery", 300),
  p("matnakash", "BRD-030", "Matnakash (500g)", "🥖", "freshbake", "bakery", 400),
  p("croissant", "BRD-040", "Croissant", "🥐", "freshbake", "bakery", 350),
  p("buns", "BRD-050", "Buns (6-pack)", "🥯", "freshbake", "bakery", 600),
  // GroceryHub (dry goods)
  p("olive", "DRY-010", "Olive oil (1L)", "🫒", "groceryhub", "dry", 3200),
  p("coffee", "DRY-020", "Coffee (250g)", "☕", "groceryhub", "dry", 2900),
  p("cornflakes", "DRY-030", "Cornflakes (500g)", "🌽", "groceryhub", "dry", 1600),
  p("pasta", "DRY-040", "Pasta (500g)", "🍝", "groceryhub", "dry", 600),
  // ColdFoods (frozen)
  p("icecream", "FRZ-010", "Ice cream (1L)", "🍦", "coldfoods", "frozen", 1800),
];

export function getProduct(id: string): Product {
  const found = PRODUCTS.find((x) => x.id === id);
  if (!found) throw new Error(`Unknown product ${id}`);
  return found;
}
