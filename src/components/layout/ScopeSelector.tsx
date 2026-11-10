import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Check, ChevronDown, Map, Store as StoreIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { useScope } from "@/app/useScope";
import { STORES, getDistrict } from "@/data/world";
import { useLocalized } from "@/lib/useLocalized";

/** Top-bar switch between one store (store manager) and all stores (head office). */
export function ScopeSelector() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const scope = useScope();
  const { store, setStoreId } = useDemo();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const chooseStore = (id: string) => {
    setStoreId(id);
    setOpen(false);
    if (scope === "chain") navigate("/today");
  };
  const chooseChain = () => {
    setOpen(false);
    navigate("/stores");
  };

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex max-w-full items-center gap-2 rounded-ctl border border-line bg-white px-3 py-2 font-medium hover:border-primary-200"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {scope === "chain" ? <Map className="size-4 shrink-0 text-muted" /> : <StoreIcon className="size-4 shrink-0 text-muted" />}
        <span className="hidden text-muted sm:inline">{scope === "chain" ? t("topbar.viewing") : t("topbar.store")}</span>
        <span className="min-w-0 truncate">{scope === "chain" ? t("topbar.allStores") : `${store.code} ${loc(store.name)}`}</span>
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-[70vh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-card border border-line bg-white p-1.5 shadow-xl shadow-ink/10" role="listbox">
          <MenuLabel>{t("topbar.headOffice")}</MenuLabel>
          <MenuRow active={scope === "chain"} onClick={chooseChain} title={t("topbar.allStores")} meta={`${STORES.length}`} />
          <MenuLabel>{t("topbar.stores")}</MenuLabel>
          {STORES.map((s) => (
            <MenuRow
              key={s.id}
              active={scope === "store" && s.id === store.id}
              onClick={() => chooseStore(s.id)}
              title={`${s.code} ${loc(s.name)}`}
              meta={loc(getDistrict(s.districtId).name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuLabel({ children }: { children: string }) {
  return <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{children}</div>;
}

function MenuRow({ active, onClick, title, meta }: { active: boolean; onClick: () => void; title: string; meta: string }) {
  return (
    <button
      onClick={onClick}
      role="option"
      aria-selected={active}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-canvas ${active ? "bg-primary-50 text-primary" : ""}`}
    >
      <span className="flex-1 truncate font-medium">{title}</span>
      <span className="text-xs text-muted">{meta}</span>
      <Check className={`size-4 ${active ? "opacity-100" : "opacity-0"}`} />
    </button>
  );
}
