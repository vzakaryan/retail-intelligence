import type { ReactNode } from "react";
import type { Tone } from "@/data/types";
import { TONE } from "./tone";

export function Pill({ tone, children, className = "" }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12.5px] font-semibold ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Small square tag used inside titles, e.g. "Online orders". */
export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-block rounded-md px-[7px] py-px text-[11px] font-semibold ${TONE[tone]}`}>{children}</span>;
}
