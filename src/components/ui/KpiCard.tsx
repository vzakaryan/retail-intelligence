import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "@/data/types";
import { Card } from "./Card";
import { IconTile } from "./IconTile";
import { InfoTip } from "./InfoTip";
import { TONE } from "./tone";

interface Props {
  icon: LucideIcon;
  iconTone: Tone;
  label: string;
  info?: string;
  value: ReactNode;
  /** Change vs. the comparison period, colored by whether it is good or bad. */
  delta?: { text: string; tone: Tone };
  foot?: ReactNode;
}

export function KpiCard({ icon, iconTone, label, info, value, delta, foot }: Props) {
  return (
    <Card className="px-5 py-[18px]">
      <div className="flex items-center gap-2.5 font-medium text-ink-2">
        <IconTile icon={icon} tone={iconTone} />
        <span className="min-w-0">{label}</span>
        {info && <InfoTip text={info} />}
      </div>
      <div className="mb-2 mt-3 text-[30px] font-bold leading-tight tracking-tight">{value}</div>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
        {delta && <span className={`whitespace-nowrap rounded-full px-2 py-0.5 font-semibold ${TONE[delta.tone]}`}>{delta.text}</span>}
        {foot}
      </div>
    </Card>
  );
}

/**
 * Tone for a change where "up" may be good or bad.
 * e.g. availability up = good; write-offs up = bad.
 */
export function deltaTone(delta: number, higherIsBetter: boolean): Tone {
  if (delta === 0) return "neutral";
  return delta > 0 === higherIsBetter ? "good" : "bad";
}
