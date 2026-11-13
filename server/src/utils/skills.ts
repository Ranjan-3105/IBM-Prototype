import { Skill } from "../modules/skills/skill.model";

interface SkillLike {
  slug: string;
  name: string;
  aliases?: string[] | null;
}

/** "React.js", "ReactJS", "react js" and "react-js" all collapse to "reactjs". */
export const toKey = (raw: string) => raw.toLowerCase().replace(/[\s.\-_/]/g, "");

/** Pure: builds a lookup from every slug / name / alias key to its catalogue slug. */
export function buildSkillIndex(skills: SkillLike[]) {
  const index = new Map<string, string>();
  for (const s of skills) {
    index.set(toKey(s.slug), s.slug);
    index.set(toKey(s.name), s.slug);
    for (const a of s.aliases ?? []) index.set(toKey(a), s.slug);
  }
  return index;
}

let cache: Map<string, string> | null = null;
let names: Map<string, string> | null = null;

export async function loadSkillIndex() {
  const all = await Skill.find({}, { slug: 1, name: 1, aliases: 1 }).lean();
  cache = buildSkillIndex(all);
  names = new Map(all.map((s) => [s.slug, s.name]));
  return cache;
}

/** Returns the catalogue slug, or null if unknown. */
export async function normaliseSkill(raw: string): Promise<string | null> {
  const index = cache ?? (await loadSkillIndex());
  return index.get(toKey(raw)) ?? null;
}

/** Normalises a list, drops unknown skills and de-duplicates. */
export async function normaliseSkills(raw: string[]): Promise<{ slugs: string[]; unknown: string[] }> {
  const slugs = new Set<string>();
  const unknown: string[] = [];
  for (const r of raw) {
    const slug = await normaliseSkill(r);
    if (slug) slugs.add(slug);
    else unknown.push(r);
  }
  return { slugs: [...slugs], unknown };
}

/** Display name for a slug ("nodejs" → "Node.js"). */
export async function skillName(slug: string) {
  if (!names) await loadSkillIndex();
  return names?.get(slug) ?? slug;
}

/** Every key the deterministic text scanner should look for (used by the AI fallback). */
export async function skillKeywords() {
  const all = await Skill.find({}, { slug: 1, name: 1, aliases: 1 }).lean();
  return all.map((s) => ({ slug: s.slug, terms: [s.name, s.slug, ...(s.aliases ?? [])] }));
}
