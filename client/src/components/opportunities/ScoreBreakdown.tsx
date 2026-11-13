import { Progress } from "@/components/ui/progress";
import type { Breakdown } from "@/types";

const PARTS: { key: keyof Breakdown; label: string; weight: number }[] = [
  { key: "S", label: "Skills", weight: 40 },
  { key: "A", label: "Availability", weight: 20 },
  { key: "L", label: "Location", weight: 15 },
  { key: "E", label: "Evidence", weight: 15 },
  { key: "P", label: "Fit", weight: 10 },
];

/** Five labelled bars for the deterministic S/A/L/E/P components. */
export function ScoreBreakdown({ breakdown, compact = false }: { breakdown: Breakdown; compact?: boolean }) {
  return (
    <dl className={compact ? "grid grid-cols-5 gap-2" : "grid gap-2.5"}>
      {PARTS.map((p) => (
        <div key={p.key} className={compact ? "min-w-0" : "grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3"}>
          <dt className="truncate text-xs text-muted-foreground">
            {p.label}
            {!compact && <span className="ml-1 opacity-70">·{p.weight}%</span>}
          </dt>
          <dd className={compact ? "mt-1" : "contents"}>
            <Progress value={breakdown[p.key]} label={`${p.label} ${breakdown[p.key]} out of 100`} indicatorClassName={breakdown[p.key] < 50 ? "bg-warning" : undefined} />
            {!compact && <span className="text-right text-xs tabular-nums text-muted-foreground">{breakdown[p.key]}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
