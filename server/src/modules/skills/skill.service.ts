import { Skill } from "./skill.model";
import { SKILL_CATALOGUE } from "./catalogue";
import { loadSkillIndex } from "../../utils/skills";
import { HttpError } from "../../middleware/errorHandler";
import type { SKILL_CATEGORIES } from "../common/constants";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function search(q?: string) {
  const filter = q
    ? { $or: [{ name: new RegExp(escapeRe(q), "i") }, { slug: new RegExp(escapeRe(q), "i") }, { aliases: new RegExp(escapeRe(q), "i") }] }
    : {};
  return Skill.find(filter).sort({ category: 1, name: 1 }).limit(q ? 20 : 500).lean();
}

export async function create(input: { slug: string; name: string; category: (typeof SKILL_CATEGORIES)[number]; aliases: string[] }) {
  if (await Skill.exists({ slug: input.slug })) throw new HttpError(409, "Skill already exists");
  const skill = await Skill.create(input);
  await loadSkillIndex(); // refresh normalisation cache
  return skill;
}

/** Inserts the built-in catalogue if the collection is empty (so a fresh DB still normalises skills). */
export async function ensureCatalogue() {
  if ((await Skill.estimatedDocumentCount()) === 0) {
    await Skill.insertMany(SKILL_CATALOGUE);
    console.log(`📚 Inserted ${SKILL_CATALOGUE.length} catalogue skills`);
  }
  await loadSkillIndex();
}
