import { cn } from "@/lib/utils";

export function Tabs<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors cursor-pointer",
            value === o.value && "bg-card text-foreground shadow-xs"
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1.5 text-xs text-muted-foreground">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
