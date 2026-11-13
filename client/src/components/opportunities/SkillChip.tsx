import { BadgeCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SkillSource } from "@/types";

/** Skill name + level dots + ✔ when endorsed by an organisation. */
export function SkillChip({ name, level, source, tone = "default", note }: { name: string; level?: number; source?: SkillSource; tone?: "default" | "have" | "missing"; note?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "have" && "border-success/30 bg-success/8 text-success",
        tone === "missing" && "border-destructive/30 bg-destructive/5 text-destructive",
        tone === "default" && "bg-card"
      )}
    >
      {name}
      {level !== undefined && (
        <span className="flex gap-0.5" aria-label={`level ${level} of 5`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={cn("size-1.5 rounded-full", i <= level ? "bg-current" : "bg-current opacity-20")} />
          ))}
        </span>
      )}
      {note && <span className="opacity-75">{note}</span>}
      {source === "ENDORSED" && <BadgeCheck className="size-3.5 text-primary" aria-label="endorsed" />}
      {source === "AI_EXTRACTED" && <Sparkles className="size-3 opacity-60" aria-label="AI extracted" />}
    </span>
  );
}
