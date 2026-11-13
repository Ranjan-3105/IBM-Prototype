import * as React from "react";
import { X } from "lucide-react";

/** Minimal accessible modal built on the native <dialog> element. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="m-auto w-[min(92vw,32rem)] rounded-xl border bg-card p-0 text-foreground shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 hover:bg-muted cursor-pointer">
          <X className="size-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
