import type { Tone } from "@/data/types";

/** Soft background + text color for status tones (pills, icon tiles, deltas). */
export const TONE: Record<Tone, string> = {
  good: "bg-good-bg text-good",
  bad: "bg-bad-bg text-bad",
  warn: "bg-warn-bg text-warn",
  info: "bg-info-bg text-info",
  primary: "bg-primary-50 text-primary",
  neutral: "bg-neutral-bg text-ink-2",
};
