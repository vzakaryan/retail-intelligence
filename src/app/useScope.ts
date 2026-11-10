import { useLocation } from "react-router";
import { ALL_NAV_ITEMS } from "./navigation";

/** "chain" on head-office pages, "store" everywhere else. */
export function useScope(): "store" | "chain" {
  const { pathname } = useLocation();
  const item = ALL_NAV_ITEMS.find((i) => pathname.startsWith(i.path));
  return item?.chain ? "chain" : "store";
}
