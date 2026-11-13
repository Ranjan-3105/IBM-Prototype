import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSkills } from "@/hooks/useSkills";
import type { UserSkill } from "@/types";
import { SkillChip } from "@/components/opportunities/SkillChip";
import { SkillPicker } from "./SkillPicker";

const LEVELS = ["", "Heard of it", "Beginner", "Can build small things", "Strong", "Expert"];

export function SkillEditor({ value, onChange }: { value: UserSkill[]; onChange: (v: UserSkill[]) => void }) {
  const { nameOf } = useSkills();
  const set = (i: number, patch: Partial<UserSkill>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="grid gap-3">
      <SkillPicker exclude={value.map((s) => s.skill)} onPick={(slug) => onChange([...value, { skill: slug, level: 2, source: "SELF" }])} />
      {value.length === 0 && <p className="text-sm text-muted-foreground">No skills yet. Search above, or use "Extract from text".</p>}
      <ul className="grid gap-2">
        {value.map((s, i) => (
          <li key={s.skill} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-lg border bg-card p-3 sm:grid-cols-[12rem_1fr_9rem_auto]">
            <SkillChip name={nameOf(s.skill)} source={s.source} />
            <div className="col-span-2 sm:col-span-1 sm:order-none order-last">
              <Slider min={1} max={5} step={1} value={s.level} onChange={(e) => set(i, { level: Number(e.target.value) })} aria-label={`${nameOf(s.skill)} level`} aria-valuetext={LEVELS[s.level]} />
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {s.level} · {LEVELS[s.level]}
            </span>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${nameOf(s.skill)}`}>
              <Trash2 aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
