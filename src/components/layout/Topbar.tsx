import { Bell, Menu, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";
import { useDemo } from "@/app/DemoContext";
import { useScope } from "@/app/useScope";
import { HEAD_OFFICE, storeManager } from "@/data/world";
import { ScopeSelector } from "./ScopeSelector";
import { pick, initials } from "@/lib/names";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t, i18n } = useTranslation();
  const scope = useScope();
  const { store } = useDemo();
  const persona = scope === "chain" ? HEAD_OFFICE : storeManager(store.id);

  return (
    <header className="sticky top-0 z-20 print:hidden flex h-16 items-center gap-2 border-b sm:gap-3 border-line bg-white px-4 lg:px-8">
      <button className="rounded-lg p-1.5 text-ink-2 hover:bg-canvas lg:hidden" onClick={onOpenMenu} aria-label={t("nav.openMenu")}>
        <Menu className="size-5" />
      </button>

      <ScopeSelector />

      <label className="hidden max-w-[320px] flex-1 items-center gap-2 rounded-ctl bg-canvas px-3 py-[9px] text-muted md:flex">
        <Search className="size-4 shrink-0" />
        <input className="w-full bg-transparent text-ink outline-none placeholder:text-muted" placeholder={t("topbar.searchPlaceholder")} />
      </label>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="flex overflow-hidden rounded-ctl border border-line text-[13px] font-semibold" role="group" aria-label={t("topbar.language")}>
          {LANGUAGES.map((lang) => {
            const active = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                disabled={!lang.ready}
                title={lang.ready ? undefined : t("topbar.armenianSoon")}
                onClick={() => void i18n.changeLanguage(lang.code)}
                className={`px-[11px] py-2 ${active ? "bg-primary-50 text-primary" : "text-muted"} ${lang.ready ? "" : "cursor-not-allowed"}`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>

        <button className="relative hidden size-[38px] place-items-center rounded-ctl border sm:grid border-line text-ink-2 hover:bg-canvas" aria-label={t("topbar.notifications")}>
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-[7px] size-[9px] rounded-full border-2 border-white bg-bad" />
        </button>

        <div className="hidden items-center gap-2.5 sm:flex">
          <div className="grid size-[38px] place-items-center rounded-full bg-primary-100 text-[13px] font-bold text-primary">{initials(persona.name)}</div>
          <div className="hidden xl:block">
            <div className="text-[13.5px] font-semibold leading-tight">{pick(persona.name)}</div>
            <div className="text-xs text-muted">{t(`roles.${persona.role}`)}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
