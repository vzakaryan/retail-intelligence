import { createHashRouter, Navigate, RouterProvider } from "react-router";
import { DemoProvider } from "@/app/DemoContext";
import { ALL_NAV_ITEMS } from "@/app/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

// Hash routing so deep links work on GitHub Pages without server rewrites.
const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      ...ALL_NAV_ITEMS.map((item) => ({ path: item.path, element: <PlaceholderPage item={item} /> })),
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
