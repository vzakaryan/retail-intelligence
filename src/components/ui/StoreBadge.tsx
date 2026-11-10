/** Small, quiet store-number badge, e.g. "03". */
export function StoreBadge({ number, label, size = "md" }: { number: string; label: string; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-6 min-w-6 text-[11px]" : "h-8 min-w-8 text-xs";
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-grid shrink-0 place-items-center rounded-lg bg-neutral-bg px-1.5 font-semibold tabular-nums text-ink-2 ${box}`}
    >
      {number}
    </span>
  );
}
