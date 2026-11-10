import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  onChange: (v: number) => void;
  /** Highlight when the value differs from the suggestion */
  changed?: boolean;
  label: string;
}

export function QtyInput({ value, onChange, changed, label }: Props) {
  const set = (v: number) => onChange(Math.max(0, Math.min(99_999, Math.round(v))));
  return (
    <div className="inline-flex shrink-0 items-center overflow-hidden rounded-[9px] border border-line bg-white">
      <button type="button" className="px-2 py-[7px] text-muted hover:bg-canvas" onClick={() => set(value - 1)} aria-label={`${label} −1`}>
        <Minus className="size-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        aria-label={label}
        onChange={(e) => set(Number(e.target.value || 0))}
        onFocus={(e) => e.target.select()}
        className={`w-14 border-x border-line py-1.5 text-center font-semibold tabular-nums outline-none [appearance:textfield] focus:bg-primary-50 [&::-webkit-inner-spin-button]:appearance-none ${
          changed ? "text-warn" : ""
        }`}
      />
      <button type="button" className="px-2 py-[7px] text-muted hover:bg-canvas" onClick={() => set(value + 1)} aria-label={`${label} +1`}>
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
