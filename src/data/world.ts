import type { District, Persona, Store, Supplier } from "./types";

/**
 * The mocked world. Values match the approved designs in
 * docs/design-references/approved/. Change numbers here, not in components.
 */

/** "Today" in the demo: Tue, Nov 10, 2026, late morning. */
export const DEMO_NOW = new Date(2026, 10, 10, 11, 0);
export const DATA_REFRESHED_AT = "06:00";

export const DISTRICTS: District[] = [
  { id: "davtashen", name: { en: "Davtashen" }, grid: { col: 1, row: 1 } },
  { id: "arabkir", name: { en: "Arabkir" }, grid: { col: 2, row: 1 } },
  { id: "kanaker-zeytun", name: { en: "Kanaker-Zeytun" }, grid: { col: 3, row: 1 } },
  { id: "avan", name: { en: "Avan" }, grid: { col: 4, row: 1 } },
  { id: "ajapnyak", name: { en: "Ajapnyak" }, grid: { col: 1, row: 2 } },
  { id: "kentron", name: { en: "Kentron" }, grid: { col: 2, row: 2 } },
  { id: "nork-marash", name: { en: "Nork-Marash" }, grid: { col: 3, row: 2 } },
  { id: "nor-nork", name: { en: "Nor Nork" }, grid: { col: 4, row: 2 } },
  { id: "malatia-sebastia", name: { en: "Malatia-Sebastia" }, grid: { col: 1, row: 3 } },
  { id: "shengavit", name: { en: "Shengavit" }, grid: { col: 2, row: 3 } },
  { id: "erebuni", name: { en: "Erebuni" }, grid: { col: 3, row: 3 } },
  { id: "nubarashen", name: { en: "Nubarashen" }, grid: { col: 3, row: 4 } },
];

const store = (
  n: number,
  name: string,
  districtId: string,
  manager: [string, string],
  kpis: [availability: number, online: number, lostSalesM: number, actedOn: number],
  today: [openTasks: number, ordersDueToday: number]
): Store => ({
  id: `s${String(n).padStart(2, "0")}`,
  code: `#${String(n).padStart(2, "0")}`,
  name: { en: name },
  districtId,
  manager: { name: manager[0], initials: manager[1] },
  kpis: {
    availability: kpis[0],
    onlineFulfillment: kpis[1],
    lostSales4w: kpis[2] * 1_000_000,
    suggestionsActedOn: kpis[3],
  },
  today: { openTasks: today[0], ordersDueToday: today[1] },
});

export const STORES: Store[] = [
  store(1, "Kentron – Mashtots", "kentron", ["Narine H.", "NH"], [97.9, 97.2, 3.1, 93], [3, 1]),
  store(2, "Kentron – Tumanyan", "kentron", ["Tigran A.", "TA"], [97.3, 96.9, 3.3, 89], [4, 2]),
  store(3, "Arabkir – Komitas", "arabkir", ["Anna M.", "AM"], [95.8, 94.1, 5.6, 86], [5, 2]),
  store(4, "Arabkir – Baghramyan", "arabkir", ["Lilit S.", "LS"], [97.0, 96.4, 3.0, 90], [3, 1]),
  store(5, "Nor Nork – Gai", "nor-nork", ["Armen K.", "AK"], [96.3, 95.6, 3.6, 84], [4, 2]),
  store(6, "Nor Nork – Vilnius", "nor-nork", ["Mariam G.", "MG"], [95.5, 95.0, 4.1, 80], [6, 2]),
  store(7, "Malatia-Sebastia – Raffi", "malatia-sebastia", ["Hayk P.", "HP"], [96.8, 96.1, 3.2, 88], [3, 1]),
  store(8, "Shengavit – Bagratunyats", "shengavit", ["Ani V.", "AV"], [94.9, 94.2, 4.8, 72], [7, 2]),
  store(9, "Erebuni", "erebuni", ["Gor T.", "GT"], [93.6, 92.8, 6.2, 54], [9, 3]),
  store(10, "Davtashen", "davtashen", ["Sona B.", "SB"], [97.1, 96.5, 2.9, 91], [2, 1]),
  store(11, "Avan", "avan", ["Karen D.", "KD"], [94.4, 93.9, 5.1, 61], [8, 2]),
  store(12, "Ajapnyak", "ajapnyak", ["Elen R.", "ER"], [95.2, 94.6, 4.4, 77], [6, 2]),
];

export const SUPPLIERS: Supplier[] = [
  { id: "dairyco", name: "DairyCo", initials: "DC", tone: "info", categories: { en: "Milk, kefir, cheese" } },
  { id: "freshbake", name: "FreshBake", initials: "FB", tone: "warn", categories: { en: "Bread, pastries" } },
  { id: "bevco", name: "BevCo", initials: "BC", tone: "bad", categories: { en: "Soft drinks, water" } },
  { id: "agrieggs", name: "AgriEggs", initials: "AE", tone: "good", categories: { en: "Eggs" } },
];

export const HEAD_OFFICE: Persona = { id: "davit", name: "Davit S.", initials: "DS", role: "headOffice" };

/** The demo's main persona: Anna M., manager of Store #03. */
export const DEFAULT_STORE_ID = "s03";

export function getStore(id: string): Store {
  const found = STORES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown store ${id}`);
  return found;
}

export function storeManager(storeId: string): Persona {
  const s = getStore(storeId);
  return { id: `mgr-${s.id}`, name: s.manager.name, initials: s.manager.initials, role: "storeManager", storeId: s.id };
}

export function getDistrict(id: string): District {
  const found = DISTRICTS.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown district ${id}`);
  return found;
}
