import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
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
  /** Extra context under the value, e.g. "11.2 days of stock · target 9" */
  sub?: ReactNode;
  /** Opens the module page with the details */
  to?: string;
}

export function KpiCard({ icon, iconTone, label, info, value, delta, foot, sub, to }: Props) {
  const body = (
    <>
      <div className="flex items-center gap-1.5 text-[14px] font-semibold sm:gap-2.5 leading-snug text-ink">
        <span className="hidden sm:contents">
          <IconTile icon={icon} tone={iconTone} />
        </span>
        <span className="min-w-0">{label}</span>
        {info && <InfoTip text={info} />}
      </div>
      <div className="mt-3 text-[22px] font-bold leading-tight tracking-tight sm:text-[30px]">{value}</div>
      {sub && <div className="mt-0.5 text-[13px] text-ink-2">{sub}</div>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        {delta && <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[13px] font-semibold ${TONE[delta.tone]}`}>{delta.text}</span>}
        {foot}
      </div>
    </>
  );
  if (to) {
    return (
      <Link to={to} className="block rounded-card border border-line bg-white px-4 py-4 sm:px-5 sm:py-[18px] transition-colors hover:border-primary/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary">
        {body}
      </Link>
    );
  }
  return <Card className="px-4 py-4 sm:px-5 sm:py-[18px]">{body}</Card>;
}

/**
 * Tone for a change where "up" may be good or bad.
 * e.g. availability up = good; write-offs up = bad.
 */
export function deltaTone(delta: number, higherIsBetter: boolean): Tone {
  if (delta === 0) return "neutral";
  return delta > 0 === higherIsBetter ? "good" : "bad";
}
