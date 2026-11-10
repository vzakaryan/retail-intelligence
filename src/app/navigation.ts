import {
  BadgePercent,
  Boxes,
  CalendarClock,
  CircleHelp,
  ClipboardList,
  Handshake,
  ListChecks,
  Map,
  Settings,
  ShoppingBag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { Store } from "@/data/types";

export type PageId =
  | "today"
  | "stockouts"
  | "orders"
  | "onlineOrders"
  | "overstock"
  | "writeOffs"
  | "suppliers"
  | "promotions"
  | "stores"
  | "settings"
  | "help";

export interface NavItem {
  id: PageId;
  path: string;
  icon: LucideIcon;
  /** "approved" = design agreed (docs/design-references/approved), "planned" = not designed yet */
  design: "approved" | "planned";
  /** Head-office (chain) page rather than a single-store page. */
  chain?: boolean;
  badge?: (store: Store) => number;
}

export interface NavGroup {
  /** i18n key under nav.groups, or null for the top item */
  groupKey: string | null;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    groupKey: null,
    items: [{ id: "today", path: "/today", icon: ListChecks, design: "approved", badge: (s) => s.today.openTasks }],
  },
  {
    groupKey: "stockDemand",
    items: [
      { id: "stockouts", path: "/stockouts", icon: TrendingUp, design: "planned" },
      { id: "orders", path: "/orders", icon: ClipboardList, design: "approved", badge: (s) => s.today.ordersDueToday },
      { id: "onlineOrders", path: "/online-orders", icon: ShoppingBag, design: "planned" },
    ],
  },
  {
    groupKey: "inventoryHealth",
    items: [
      { id: "overstock", path: "/overstock", icon: Boxes, design: "planned" },
      { id: "writeOffs", path: "/write-offs", icon: CalendarClock, design: "planned" },
    ],
  },
  {
    groupKey: "partnersSales",
    items: [
      { id: "suppliers", path: "/suppliers", icon: Handshake, design: "planned" },
      { id: "promotions", path: "/promotions", icon: BadgePercent, design: "planned" },
    ],
  },
  {
    groupKey: "headOffice",
    items: [{ id: "stores", path: "/stores", icon: Map, design: "approved", chain: true }],
  },
];

export const FOOTER_NAV: NavItem[] = [
  { id: "settings", path: "/settings", icon: Settings, design: "planned" },
  { id: "help", path: "/help", icon: CircleHelp, design: "planned" },
];

export const ALL_NAV_ITEMS: NavItem[] = [...NAV.flatMap((g) => g.items), ...FOOTER_NAV];
