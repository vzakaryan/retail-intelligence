import { useEffect, type ReactNode } from "react";

/** Small centered dialog. */
export function Modal({ open, onClose, children, labelledBy }: { open: boolean; onClose: () => void; children: ReactNode; labelledBy: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/35 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="w-full max-w-md rounded-card bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
