interface Option<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex gap-0.5 rounded-ctl bg-[#ececf2] p-[3px]" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
            o.value === value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink-2"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
