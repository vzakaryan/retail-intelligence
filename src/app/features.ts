import type { PageId } from "./navigation";

/**
 * MVP switches — what the deployed demo shows.
 *
 * The client's first demo shows a small MVP: My store today, Stockout risk,
 * Order suggestions, Online orders, Expiry & write-offs. Everything else is
 * still in the code and comes back by flipping a flag here, or for one visit
 * by opening the demo with `?full=1` (e.g. .../retail-intelligence/?full=1#/today).
 * The full version before the MVP cut is git tag `full-version-v1`.
 */

/** `?full=1` anywhere in the URL turns every switch on (remembered for this tab). */
function fullMode(): boolean {
  try {
    const href = window.location.href;
    if (/[?&]full=1\b/.test(href)) sessionStorage.setItem("ri-full", "1");
    if (/[?&]full=0\b/.test(href)) sessionStorage.removeItem("ri-full");
    return sessionStorage.getItem("ri-full") === "1";
  } catch {
    return false;
  }
}

export const FULL_MODE = fullMode();

/** Modules (sidebar items + routes). false = hidden in the MVP. */
const PAGE_SWITCHES: Record<PageId, boolean> = {
  today: true,
  stockouts: true,
  orders: true,
  onlineOrders: true,
  writeOffs: true,
  overstock: false,
  suppliers: false,
  promotions: false,
  stores: false,
  settings: false,
  help: false,
};

/** Sections inside the kept pages. false = hidden in the MVP. */
const SECTION_SWITCHES = {
  /** My store today: the "Sales" row (basket, receipts, online share) and the "Excess inventory" card. Off = one row of 4. */
  todayAllKpis: false,
  /** My store today: "Your results so far" (impact since go-live). */
  todayResults: false,
  /** "Before vs with the product" trend charts (Stockout risk, Online orders, Expiry). The client hasn't started yet. */
  adoptionTrends: false,
  /** Order suggestions: delivery check and receiving (steps 3–4, "Did everything arrive?"). */
  orderReceiving: false,
  /** Top bar: product search and notifications (not functional in the demo). */
  topbarExtras: false,
};

export type SectionId = keyof typeof SECTION_SWITCHES;

export const pageOn = (id: PageId): boolean => FULL_MODE || PAGE_SWITCHES[id];
export const sectionOn = (id: SectionId): boolean => FULL_MODE || SECTION_SWITCHES[id];
/** Show the small "MVP" label next to the logo. */
export const SHOW_MVP_LABEL = !FULL_MODE;
