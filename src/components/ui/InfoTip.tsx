import { Info } from "lucide-react";

/** Small (i) icon with a hover / focus tooltip. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex" tabIndex={0} aria-label={text}>
      <Info className="size-3.5 text-faint" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        {text}
      </span>
    </span>
  );
}
