/** Horizontal bar with an optional target marker. */
export function HBar({ label, value, max, color, target, right }: { label: string; value: number; max: number; color: string; target?: number; right: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr_auto] items-center gap-3 py-[9px]">
      <span className="font-medium">{label}</span>
      <div className="relative h-2.5 rounded-full bg-[#eeeef4]">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
        {target !== undefined && <div className="absolute -inset-y-1 w-0.5 rounded bg-ink" style={{ left: `${(target / max) * 100}%` }} />}
      </div>
      <span className="whitespace-nowrap text-right font-semibold tabular-nums">{right}</span>
    </div>
  );
}
