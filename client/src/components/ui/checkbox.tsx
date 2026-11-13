import * as React from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, label, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode }) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cn("inline-flex cursor-pointer items-center gap-2 text-sm", className)}>
      <input id={inputId} type="checkbox" className="size-4 rounded border-input accent-[var(--color-primary)]" {...props} />
      {label}
    </label>
  );
}
