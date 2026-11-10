import type { Store } from "@/data/types";
import { getDistrict } from "@/data/world";
import { useLocalized } from "./useLocalized";

/** Human-friendly store names: "Komitas Ave" + district "Arabkir" → "Komitas Ave, Arabkir". */
export function useStoreLabel() {
  const loc = useLocalized();
  const name = (s: Store) => loc(s.name);
  const district = (s: Store) => loc(getDistrict(s.districtId).name);
  return { name, district, full: (s: Store) => `${name(s)}, ${district(s)}` };
}
