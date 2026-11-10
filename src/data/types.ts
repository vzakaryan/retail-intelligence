/**
 * Shared types for the mocked "world" of the demo.
 * Every screen reads from src/data so numbers stay consistent everywhere.
 */

/** Text that comes from mock data (names etc.) — Armenian added later. */
export interface Localized {
  en: string;
  hy?: string;
}

export interface District {
  id: string;
  name: Localized;
  /** Position on the schematic district tile map (1-based grid); `span` = columns wide. */
  grid: { col: number; row: number; span?: number };
}

export interface StoreKpis {
  /** Shelf availability, %, last 4 weeks */
  availability: number;
  /** Online orders completed in full, %, last 4 weeks */
  onlineFulfillment: number;
  /** Estimated lost sales, AMD, last 4 weeks */
  lostSales4w: number;
  /** Share of suggestions the store acted on, %, last 4 weeks */
  suggestionsActedOn: number;
}

export interface Store {
  id: string;
  /** Store number, e.g. "03" — shown as a small badge, never as "#03" */
  number: string;
  /** Branch name = its street, e.g. "Komitas Ave". Shown with the district: "Komitas Ave, Arabkir". */
  name: Localized;
  districtId: string;
  manager: { name: string; initials: string };
  kpis: StoreKpis;
  /** Counts shown in navigation badges for "today". */
  today: { openTasks: number; ordersDueToday: number };
}

export type Tone = "good" | "bad" | "warn" | "info" | "primary" | "neutral";

export interface Supplier {
  id: string;
  name: string;
  initials: string;
  tone: Tone;
  categories: Localized;
}

export interface Persona {
  id: string;
  name: string;
  initials: string;
  role: "storeManager" | "headOffice";
  storeId?: string;
}
