import type { z } from "zod";
import { User } from "./user.model";
import { SkillEvidence } from "../evidence/evidence.model";
import { HttpError } from "../../middleware/errorHandler";
import { normaliseSkill, skillKeywords, skillName } from "../../utils/skills";
import { extractProfile } from "../../services/ai.service";
import type { UpdateSeekerProfileSchema, UpdateOrgProfileSchema } from "./user.schema";

type SkillEntry = { skill: string; level: number; source?: string | null };

/** Profile strength (0–100) and evidence score (% of skills backed by proof or endorsement). */
export async function profileStats(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user) throw new HttpError(404, "User not found");
  const evidence = await SkillEvidence.find({ user: userId }).lean();
  const evidenced = new Set(evidence.flatMap((e) => e.skills ?? []));
  const skills = (user.skills ?? []) as SkillEntry[];
  const backed = skills.filter((s) => evidenced.has(s.skill) || s.source === "ENDORSED").length;
  const endorsed = skills.filter((s) => s.source === "ENDORSED").length;

  const parts = {
    about: user.headline || user.bio ? 15 : 0,
    skills: Math.min(skills.length, 5) * 5, // up to 25
    availability: user.availability?.hoursPerWeek ? 10 : 0,
    location: user.area || user.location ? 10 : 0,
    preferences: user.preferences?.types?.length ? 10 : 0,
    evidence: Math.min(evidence.length, 2) * 10, // up to 20
    endorsements: endorsed > 0 ? 10 : 0,
  };
  const profileStrength = Object.values(parts).reduce((a, b) => a + b, 0);
  const evidenceScore = skills.length ? Math.round((100 * backed) / skills.length) : 0;
  return { profileStrength, evidenceScore, evidenceCount: evidence.length, endorsedSkills: endorsed };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");
  const stats = user.role === "SEEKER" ? await profileStats(userId) : null;
  return { ...user.toJSON(), stats };
}

/** Update seeker profile fields — `verified` and org-only fields are excluded. */
export async function updateSeekerProfile(userId: string, input: z.infer<typeof UpdateSeekerProfileSchema>) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");

  const { skills, location, ...rest } = input;
  user.set(rest);
  if (location) user.set("location", { type: "Point", coordinates: location.coordinates });

  if (skills) {
    const previous = new Map((user.skills as SkillEntry[]).map((s) => [s.skill, s]));
    const unknown: string[] = [];
    const next = new Map<string, SkillEntry>();
    for (const s of skills) {
      const slug = await normaliseSkill(s.skill);
      if (!slug) {
        unknown.push(s.skill);
        continue;
      }
      // keep ENDORSED status earned from organisations
      const source = previous.get(slug)?.source === "ENDORSED" ? "ENDORSED" : (s.source ?? "SELF");
      const existing = next.get(slug);
      if (!existing || existing.level < s.level) next.set(slug, { skill: slug, level: s.level, source });
    }
    if (unknown.length) throw new HttpError(400, `Unknown skills: ${unknown.join(", ")}`);
    user.set("skills", [...next.values()]);
  }

  await user.save();
  return getMe(userId);
}

/** Update organisation profile fields — `verified` is never updated via this path. */
export async function updateOrgProfile(userId: string, input: z.infer<typeof UpdateOrgProfileSchema>) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");

  const { location, ...rest } = input;
  user.set(rest);
  if (location) user.set("location", { type: "Point", coordinates: location.coordinates });

  await user.save();
  return getMe(userId);
}

/** Legacy alias used by the old PUT /api/users/me route — delegates to updateSeekerProfile. */
export async function updateMe(userId: string, input: z.infer<typeof UpdateSeekerProfileSchema>) {
  return updateSeekerProfile(userId, input);
}

/** Add a single skill to a seeker profile. Rejects duplicates (409). */
export async function addSkill(
  userId: string,
  input: { skill: string; level: number; source?: string }
) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");

  const slug = await normaliseSkill(input.skill);
  if (!slug) throw new HttpError(400, `Unknown skill: ${input.skill}`);

  const existing = (user.skills as SkillEntry[]).find((s) => s.skill === slug);
  if (existing) throw new HttpError(409, `Skill '${slug}' already added`);

  (user.skills as SkillEntry[]).push({ skill: slug, level: input.level, source: input.source ?? "SELF" });
  await user.save();
  return getMe(userId);
}

/** Edit proficiency/source of an existing skill by slug. */
export async function editSkill(
  userId: string,
  slug: string,
  input: { level?: number; source?: string }
) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");

  const entry = (user.skills as SkillEntry[]).find((s) => s.skill === slug);
  if (!entry) throw new HttpError(404, `Skill '${slug}' not found in profile`);

  // Cannot downgrade ENDORSED via self-service
  if (entry.source === "ENDORSED" && input.source && input.source !== "ENDORSED") {
    throw new HttpError(403, "Cannot change source of an endorsed skill");
  }
  if (input.level !== undefined) entry.level = input.level;
  if (input.source !== undefined && entry.source !== "ENDORSED") entry.source = input.source;

  await user.save();
  return getMe(userId);
}

/** Remove a skill from the seeker profile by slug. */
export async function removeSkill(userId: string, slug: string) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");

  const before = (user.skills as SkillEntry[]).length;
  user.set(
    "skills",
    (user.skills as SkillEntry[]).filter((s) => s.skill !== slug)
  );
  if ((user.skills as SkillEntry[]).length === before) {
    throw new HttpError(404, `Skill '${slug}' not found in profile`);
  }
  await user.save();
}

/** AI (or fallback) extraction → normalised catalogue skills. Suggestions only; nothing is saved here. */
export async function extractSkills(text: string) {
  const catalogue = await skillKeywords();
  const out = await extractProfile(text, catalogue);
  const bySlug = new Map<string, { skill: string; name: string; level: number; evidence: string }>();
  const unknown: string[] = [];
  for (const s of out.skills) {
    const slug = await normaliseSkill(s.name);
    if (!slug) {
      unknown.push(s.name);
      continue;
    }
    const prev = bySlug.get(slug);
    if (!prev || prev.level < s.level)
      bySlug.set(slug, { skill: slug, name: await skillName(slug), level: s.level, evidence: s.evidence });
  }
  return {
    skills: [...bySlug.values()],
    unknown,
    hoursPerWeek: out.hoursPerWeek,
    remoteOnly: out.remoteOnly,
    preferredTypes: out.preferredTypes,
    source: out.source,
  };
}
