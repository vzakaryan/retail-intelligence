import type { District, Persona, Store, Supplier } from "./types";

/**
 * The mocked world. Values match the approved designs in
 * docs/design-references/approved/. Change numbers here, not in components.
 */

/** "Today" in the demo: Tue, Nov 10, 2026, late morning. */
export const DEMO_NOW = new Date(2026, 10, 10, 11, 0);
export const DATA_REFRESHED_AT = "06:00";

export const DISTRICTS: District[] = [
  { id: "davtashen", name: { en: "Davtashen", hy: "Դավթաշեն" }, grid: { col: 1, row: 1 } },
  { id: "arabkir", name: { en: "Arabkir", hy: "Արաբկիր" }, grid: { col: 2, row: 1 } },
  { id: "kanaker-zeytun", name: { en: "Kanaker-Zeytun", hy: "Քանաքեռ-Զեյթուն" }, grid: { col: 3, row: 1 } },
  { id: "avan", name: { en: "Avan", hy: "Ավան" }, grid: { col: 4, row: 1 } },
  { id: "ajapnyak", name: { en: "Ajapnyak", hy: "Աջափնյակ" }, grid: { col: 1, row: 2 } },
  { id: "kentron", name: { en: "Kentron", hy: "Կենտրոն" }, grid: { col: 2, row: 2 } },
  { id: "nork-marash", name: { en: "Nork-Marash", hy: "Նորք-Մարաշ" }, grid: { col: 3, row: 2 } },
  { id: "nor-nork", name: { en: "Nor Nork", hy: "Նոր Նորք" }, grid: { col: 4, row: 2 } },
  { id: "malatia-sebastia", name: { en: "Malatia-Sebastia", hy: "Մալաթիա-Սեբաստիա" }, grid: { col: 1, row: 3 } },
  { id: "shengavit", name: { en: "Shengavit", hy: "Շենգավիթ" }, grid: { col: 2, row: 3 } },
  { id: "erebuni", name: { en: "Erebuni", hy: "Էրեբունի" }, grid: { col: 3, row: 3 } },
  { id: "nubarashen", name: { en: "Nubarashen", hy: "Նուբարաշեն" }, grid: { col: 2, row: 4, span: 2 } },
];

const store = (
  n: number,
  name: [en: string, hy: string],
  districtId: string,
  manager: [en: string, hy: string],
  kpis: [availability: number, online: number, lostSalesM: number, actedOn: number],
  today: [openTasks: number, ordersDueToday: number]
): Store => ({
  id: `s${String(n).padStart(2, "0")}`,
  number: String(n).padStart(2, "0"),
  name: { en: name[0], hy: name[1] },
  districtId,
  manager: { name: { en: manager[0], hy: manager[1] } },
  kpis: {
    availability: kpis[0],
    onlineFulfillment: kpis[1],
    lostSales4w: kpis[2] * 1_000_000,
    suggestionsActedOn: kpis[3],
  },
  today: { openTasks: today[0], ordersDueToday: today[1] },
});

export const STORES: Store[] = [
  store(1, ["Mashtots Ave", "Մաշտոցի պողոտա"], "kentron", ["Narine H.", "Նարինե Հ."], [97.9, 97.2, 3.1, 93], [3, 1]),
  store(2, ["Tumanyan St", "Թումանյան փողոց"], "kentron", ["Tigran A.", "Տիգրան Ա."], [97.3, 96.9, 3.3, 89], [4, 2]),
  store(3, ["Komitas Ave", "Կոմիտասի պողոտա"], "arabkir", ["Anna M.", "Աննա Մ."], [95.8, 94.1, 5.6, 86], [5, 2]),
  store(4, ["Baghramyan Ave", "Բաղրամյան պողոտա"], "arabkir", ["Lilit S.", "Լիլիթ Ս."], [97.0, 96.4, 3.0, 90], [3, 1]),
  store(5, ["Gai Ave", "Գայի պողոտա"], "nor-nork", ["Armen K.", "Արմեն Կ."], [96.3, 95.6, 3.6, 84], [4, 2]),
  store(6, ["Vilnius St", "Վիլնյուսի փողոց"], "nor-nork", ["Mariam G.", "Մարիամ Գ."], [95.5, 95.0, 4.1, 80], [6, 2]),
  store(7, ["Raffi St", "Րաֆֆու փողոց"], "malatia-sebastia", ["Hayk P.", "Հայկ Պ."], [96.8, 96.1, 3.2, 88], [3, 1]),
  store(8, ["Bagratunyats Ave", "Բագրատունյաց պողոտա"], "shengavit", ["Ani V.", "Անի Վ."], [94.9, 94.2, 4.8, 72], [7, 2]),
  store(9, ["Erebuni St", "Էրեբունու փողոց"], "erebuni", ["Gor T.", "Գոռ Թ."], [93.6, 92.8, 6.2, 54], [9, 3]),
  store(10, ["Tevosyan St", "Տևոսյան փողոց"], "davtashen", ["Sona B.", "Սոնա Բ."], [97.1, 96.5, 2.9, 91], [2, 1]),
  store(11, ["Khudyakov St", "Խուդյակովի փողոց"], "avan", ["Karen D.", "Կարեն Դ."], [94.4, 93.9, 5.1, 61], [8, 2]),
  store(12, ["Halabyan St", "Հալաբյան փողոց"], "ajapnyak", ["Elen R.", "Էլեն Ռ."], [95.2, 94.6, 4.4, 77], [6, 2]),
];

export const SUPPLIERS: Supplier[] = [
  { id: "dairyco", name: { en: "Aragil Dairy", hy: "Արագիլ Կաթ" }, tone: "info", categories: { en: "Milk, kefir, cheese", hy: "Կաթ, կեֆիր, պանիր" } },
  { id: "freshbake", name: { en: "Tonir Bakery", hy: "Թոնիր Հացատուն" }, tone: "warn", categories: { en: "Bread, pastries", hy: "Հաց, թխվածքներ" } },
  { id: "bevco", name: { en: "Hrazdan Drinks", hy: "Հրազդան Ըմպելիքներ" }, tone: "bad", categories: { en: "Soft drinks, water", hy: "Զովացուցիչ ըմպելիքներ, ջուր" } },
  { id: "agrieggs", name: { en: "Nairi Eggs", hy: "Նաիրի Ձու" }, tone: "good", categories: { en: "Eggs", hy: "Ձու" } },
  { id: "groceryhub", name: { en: "Masis Trade", hy: "Մասիս Թրեյդ" }, tone: "primary", categories: { en: "Dry goods", hy: "Չոր մթերք" } },
  { id: "coldfoods", name: { en: "Aragats Frost", hy: "Արագած Ֆրոստ" }, tone: "info", categories: { en: "Frozen food", hy: "Սառեցված մթերք" } },
];

export const HEAD_OFFICE: Persona = { id: "davit", name: { en: "Davit S.", hy: "Դավիթ Ս." }, role: "headOffice" };

/** The demo's main persona: Anna M., manager of store 03 (Komitas Ave, Arabkir). */
export const DEFAULT_STORE_ID = "s03";

export function getStore(id: string): Store {
  const found = STORES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown store ${id}`);
  return found;
}

export function storeManager(storeId: string): Persona {
  const s = getStore(storeId);
  return { id: `mgr-${s.id}`, name: s.manager.name, role: "storeManager", storeId: s.id };
}

export function getDistrict(id: string): District {
  const found = DISTRICTS.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown district ${id}`);
  return found;
}

// ------------------------------------------------------------- Chain view

/** Change vs. the prior 4 weeks for the chain-level KPIs (head-office screen). */
export const CHAIN_DELTAS = {
  availabilityPp: 1.3,
  onlineFulfillmentPp: 1.4,
  lostSalesPct: -14,
  actedOnPp: 6,
};

/** Stores acting on at least this share of suggestions count as "high adoption". */
export const HIGH_ADOPTION_PCT = 85;

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

export function chainKpis(stores: Store[] = STORES) {
  return {
    availability: avg(stores.map((s) => s.kpis.availability)),
    onlineFulfillment: avg(stores.map((s) => s.kpis.onlineFulfillment)),
    lostSales4w: stores.reduce((a, s) => a + s.kpis.lostSales4w, 0),
    suggestionsActedOn: avg(stores.map((s) => s.kpis.suggestionsActedOn)),
  };
}

/** Average availability of stores that act on most suggestions vs. the rest. */
export function adoptionInsight(stores: Store[] = STORES) {
  const high = stores.filter((s) => s.kpis.suggestionsActedOn >= HIGH_ADOPTION_PCT);
  const rest = stores.filter((s) => s.kpis.suggestionsActedOn < HIGH_ADOPTION_PCT);
  return {
    high: { count: high.length, availability: avg(high.map((s) => s.kpis.availability)) },
    rest: { count: rest.length, availability: avg(rest.map((s) => s.kpis.availability)) },
  };
}

export function districtStats(districtId: string) {
  const stores = STORES.filter((s) => s.districtId === districtId);
  return { count: stores.length, availability: stores.length ? avg(stores.map((s) => s.kpis.availability)) : undefined };
}
