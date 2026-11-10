import { NavLink } from "react-router";
import { ShoppingCart, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FOOTER_NAV, NAV, type NavItem } from "@/app/navigation";
import { useDemo } from "@/app/DemoContext";
import { DATA_REFRESHED_AT } from "@/data/world";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {/* Backdrop on small screens */}
      <div
        className={`fixed inset-0 z-30 bg-ink/30 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      >
        <button
          className="absolute left-[260px] top-4 rounded-full bg-white/90 p-2 text-ink shadow"
          onClick={onClose}
          aria-label={t("nav.closeMenu")}
        >
          <X className="size-5" />
        </button>
      </div>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-white px-3.5 py-[18px] transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-2 pb-[18px]">
          <div className="grid size-9 place-items-center rounded-ctl bg-primary text-white">
            <ShoppingCart className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold leading-tight">{t("app.name")}</div>
            <div className="text-xs text-muted">{t("app.tagline")}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {NAV.map((group) => (
            <div key={group.groupKey ?? "top"}>
              {group.groupKey && (
                <div className="px-2.5 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  {t(`nav.groups.${group.groupKey}`)}
                </div>
              )}
              {group.items.map((item) => (
                <SidebarLink key={item.id} item={item} onNavigate={onClose} />
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-line pt-2.5">
          {FOOTER_NAV.map((item) => (
            <SidebarLink key={item.id} item={item} onNavigate={onClose} />
          ))}
          <div className="flex items-center gap-1.5 px-2.5 pt-2 text-xs text-muted">
            <span className="size-[7px] rounded-full bg-good" />
            {t("app.dataFreshness", { time: DATA_REFRESHED_AT })}
          </div>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const { t } = useTranslation();
  const { store } = useDemo();
  const Icon = item.icon;
  const badge = item.badge?.(store);

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-ctl px-2.5 py-[9px] font-medium transition-colors ${
          isActive ? "bg-primary-50 font-semibold text-primary" : "text-ink-2 hover:bg-canvas"
        }`
      }
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="truncate">{t(`nav.items.${item.id}`)}</span>
      {!!badge && (
        <span className="ml-auto rounded-full bg-bad-bg px-2 py-px text-[11px] font-semibold text-bad">{badge}</span>
      )}
    </NavLink>
  );
}
