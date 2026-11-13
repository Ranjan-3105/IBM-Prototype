import { cn } from "@/lib/utils";

/** Coloured % badge: ≥80 green, 60–79 amber, <60 grey. */
export function MatchBadge({ score, className, size = "md" }: { score: number; className?: string; size?: "md" | "lg" }) {
  const tone = score >= 80 ? "bg-success/12 text-success ring-success/25" : score >= 60 ? "bg-warning/15 text-[oklch(0.5_0.12_60)] ring-warning/30" : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={cn("inline-flex items-center rounded-full font-semibold tabular-nums ring-1 ring-inset", size === "lg" ? "px-3.5 py-1.5 text-lg" : "px-2.5 py-1 text-sm", tone, className)}
      aria-label={`${score} percent match`}
    >
      {score}%<span className="ml-1 text-xs font-medium opacity-80">match</span>
    </span>
  );
}
