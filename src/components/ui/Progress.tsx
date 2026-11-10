export function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-[#eeeef4] ${className}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-good transition-[width] duration-300" style={{ width: `${value}%` }} />
    </div>
  );
}
