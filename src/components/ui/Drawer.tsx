import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  closeLabel: string;
}

/** Right-hand side panel for details ("progressive disclosure"). */
export function Drawer({ open, onClose, header, footer, children, closeLabel }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-ink/30 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[540px] flex-col bg-white transition-transform duration-200 ${
          open ? "translate-x-0 shadow-[-12px_0_40px_rgba(20,20,50,.16)]" : "invisible translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3.5 border-b border-line px-6 py-5">
          <div className="min-w-0 flex-1">{header}</div>
          <button onClick={onClose} className="rounded-lg p-2 text-ink-2 hover:bg-canvas" aria-label={closeLabel}>
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-line px-6 py-4">{footer}</div>}
      </aside>
    </>
  );
}
