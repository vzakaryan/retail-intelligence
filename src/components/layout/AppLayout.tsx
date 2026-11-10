import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-full">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-w-0 lg:ml-[248px] print:ml-0">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-[1260px] px-4 pb-10 pt-7 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
