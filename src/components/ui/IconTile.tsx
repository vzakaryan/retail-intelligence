import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/data/types";
import { TONE } from "./tone";

export function IconTile({ icon: Icon, tone, size = "md" }: { icon: LucideIcon; tone: Tone; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-10 rounded-[11px]" : "size-[34px] rounded-ctl";
  return (
    <div className={`grid shrink-0 place-items-center ${box} ${TONE[tone]}`}>
      <Icon className={size === "lg" ? "size-5" : "size-[18px]"} />
    </div>
  );
}
