import { useId, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSkills } from "@/hooks/useSkills";
import { cn } from "@/lib/utils";

/** Catalogue autocomplete: type "react", "reactjs" or "node" and pick the canonical skill. */
export function SkillPicker({ onPick, exclude = [], placeholder = "Search skills (e.g. React, Canva, Excel)" }: { onPick: (slug: string) => void; exclude?: string[]; placeholder?: string }) {
  const { skills } = useSkills();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/[\s.\-_]/g, "");
    if (!term) return [];
    return skills
      .filter((s) => !exclude.includes(s.slug))
      .filter((s) => [s.slug, s.name, ...s.aliases].some((k) => k.toLowerCase().replace(/[\s.\-_]/g, "").includes(term)))
      .slice(0, 8);
  }, [q, skills, exclude]);

  const pick = (slug: string) => {
    onPick(slug);
    setQ("");
    setActive(0);
  };

  return (
    <div className="relative">
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          else if (e.key === "Enter" && results[active]) {
            e.preventDefault();
            pick(results[active].slug);
          } else if (e.key === "Escape") setQ("");
        }}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Add a skill"
      />
      {results.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-card p-1 shadow-lg">
          {results.map((s, i) => (
            <li key={s.slug} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(s.slug)}
                className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm cursor-pointer", i === active && "bg-muted")}
              >
                <span>{s.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {s.category.toLowerCase()} <Plus className="size-3.5" aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
