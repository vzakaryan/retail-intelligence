export function ProductThumb({ emoji, size = "md" }: { emoji: string; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-[34px] text-lg" : "size-10 text-[22px]";
  return (
    <div className={`grid shrink-0 place-items-center rounded-ctl bg-canvas ${box}`} aria-hidden>
      {emoji}
    </div>
  );
}
