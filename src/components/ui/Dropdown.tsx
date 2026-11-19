import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  /** Shown before the value on the button, e.g. "Category" */
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  /** Draw a line under the first option (e.g. "All") */
  separateFirst?: boolean;
}

/** Button + menu in the same style as the store selector in the top bar. */
export function Dropdown<T extends string>({ label, value, options, onChange, separateFirst }: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex min-w-[11rem] items-center gap-1.5 rounded-ctl border bg-white px-3 py-2 text-[13px] transition-colors hover:border-primary-200 ${open ? "border-primary-200 ring-2 ring-primary-50" : "border-line"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-muted">{label}:</span>
        <span className="flex-1 text-left font-semibold text-ink">{current?.label}</span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[11rem] rounded-ctl border border-line bg-white py-1 shadow-lg shadow-ink/10 sm:left-auto sm:right-0">
          {options.map((o, i) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-canvas ${active ? "font-semibold text-primary" : "text-ink"} ${separateFirst && i === 0 ? "mb-1 border-b border-line" : ""}`}
              >
                <span className="flex-1 truncate">{o.label}</span>
                {active && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
