import { createHashRouter, Navigate, RouterProvider } from "react-router";
import { DemoProvider } from "@/app/DemoContext";
import { ALL_NAV_ITEMS } from "@/app/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { TodayPage } from "@/pages/today/TodayPage";
import { OrdersListPage } from "@/pages/orders/OrdersListPage";
import { OrderReviewPage } from "@/pages/orders/OrderReviewPage";
import { OrderPlacePage } from "@/pages/orders/OrderPlacePage";
import { OrderDonePage } from "@/pages/orders/OrderDonePage";
import { StoresPage } from "@/pages/stores/StoresPage";
import { StockoutsPage } from "@/pages/stockouts/StockoutsPage";
import { OnlinePage } from "@/pages/online/OnlinePage";
import { OverstockPage } from "@/pages/overstock/OverstockPage";
import { ExpiryPage } from "@/pages/expiry/ExpiryPage";
import type { PageId } from "@/app/navigation";
import type { ReactElement } from "react";

/** Screens that are built. Everything else shows a placeholder. */
const PAGES: Partial<Record<PageId, () => ReactElement>> = {
  today: () => <TodayPage />,
  orders: () => <OrdersListPage />,
  stores: () => <StoresPage />,
  stockouts: () => <StockoutsPage />,
  onlineOrders: () => <OnlinePage />,
  overstock: () => <OverstockPage />,
  writeOffs: () => <ExpiryPage />,
};

// Hash routing so deep links work on GitHub Pages without server rewrites.
const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      ...ALL_NAV_ITEMS.map((item) => ({ path: item.path, element: PAGES[item.id]?.() ?? <PlaceholderPage item={item} /> })),
      { path: "/orders/:orderId", element: <OrderReviewPage /> },
      { path: "/orders/:orderId/place", element: <OrderPlacePage /> },
      { path: "/orders/:orderId/done", element: <OrderDonePage /> },
      { path: "*", element: <Navigate to="/today" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <DemoProvider>
      <RouterProvider router={router} />
    </DemoProvider>
  );
}
