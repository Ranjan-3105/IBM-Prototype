import type { Types } from "mongoose";
import { Opportunity } from "../opportunities/opportunity.model";
import { seekerContext, rankProfile, explainAll } from "../matching/matching.service";
import type { OpportunityLike, SeekerProfile } from "../matching/engine";
import { extractSkills } from "../users/user.service";
import { skillName } from "../../utils/skills";

type OppLean = OpportunityLike & { _id: Types.ObjectId; title: string };

/** "Your Next Opportunity": free text → profile → top 3 eligible matches → one concrete next step. */
export async function nextOpportunity(userId: string, text: string, useSavedProfile: boolean) {
  const extracted = await extractSkills(text);
  const { seeker: saved, evidenced } = await seekerContext(userId);

  const skills = new Map<string, { skill: string; level: number; source: string }>();
  if (useSavedProfile) for (const s of saved.skills ?? []) skills.set(s.skill, { skill: s.skill, level: s.level, source: s.source ?? "SELF" });
  for (const s of extracted.skills) {
    const prev = skills.get(s.skill);
    if (!prev || prev.level < s.level) skills.set(s.skill, { skill: s.skill, level: s.level, source: prev?.source === "ENDORSED" ? "ENDORSED" : "AI_EXTRACTED" });
  }

  const base = useSavedProfile ? saved : ({ skills: [] } as SeekerProfile);
  const profile: SeekerProfile = {
    skills: [...skills.values()],
    location: base.location ?? null,
    accessibilityNeeds: base.accessibilityNeeds ?? [],
    availability: {
      hoursPerWeek: extracted.hoursPerWeek ?? base.availability?.hoursPerWeek ?? 10,
      remoteOnly: extracted.remoteOnly ?? base.availability?.remoteOnly ?? false,
      maxTravelKm: base.availability?.maxTravelKm ?? 15,
    },
    preferences: {
      types: extracted.preferredTypes.length ? extracted.preferredTypes : (base.preferences?.types ?? []),
      paidOnly: base.preferences?.paidOnly ?? false,
    },
  };

  const opps = (await Opportunity.find({ status: "OPEN" }).populate("organisation", "name orgType area").lean()) as unknown as OppLean[];
  const ranked = rankProfile(profile, opps, useSavedProfile ? evidenced : new Set(), 3);
  // Temporary profile → don't write these explanations into the user's Match cache.
  const top3 = await explainAll(null, ranked.matches);

  // Next step: the missing skill that appears most often across the top matches and near misses.
  const tally = new Map<string, { count: number; unlocks: Set<string>; needed: number }>();
  for (const m of [...ranked.matches, ...ranked.nearMisses]) {
    for (const s of m.missingSkills) {
      const t = tally.get(s.skill) ?? { count: 0, unlocks: new Set<string>(), needed: s.needed };
      t.count += s.mandatory ? 2 : 1;
      t.unlocks.add(m.opportunity.title);
      t.needed = Math.max(t.needed, s.needed);
      tally.set(s.skill, t);
    }
  }
  const best = [...tally.entries()].sort((a, b) => b[1].count - a[1].count || b[1].unlocks.size - a[1].unlocks.size)[0];
  let nextStep: { skill: string | null; name: string; text: string; unlocks: string[] };
  if (best) {
    const [slug, t] = best;
    const name = await skillName(slug);
    nextStep = {
      skill: slug,
      name,
      unlocks: [...t.unlocks].slice(0, 4),
      text: `Learn ${name} to level ${t.needed}: build one small project with it this week and add it to your profile as evidence. It appears in ${t.unlocks.size} of the roles closest to you.`,
    };
  } else if (top3.length) {
    nextStep = { skill: null, name: "", unlocks: [], text: `Apply to "${top3[0]!.opportunity.title}" — you already meet every requirement.` };
  } else {
    nextStep = { skill: null, name: "", unlocks: [], text: "Add a few more skills or increase your weekly hours to unlock matches." };
  }

  return {
    profile: {
      skills: await Promise.all(
        profile.skills.map(async (s) => ({
          ...s,
          name: await skillName(s.skill),
          evidence: extracted.skills.find((e) => e.skill === s.skill)?.evidence ?? null,
        }))
      ),
      extracted: extracted.skills,
      hoursPerWeek: profile.availability!.hoursPerWeek,
      remoteOnly: profile.availability!.remoteOnly,
      preferredTypes: profile.preferences!.types,
      source: extracted.source,
    },
    top3,
    nearMisses: ranked.nearMisses.slice(0, 3).map(({ opportunity, ...m }) => ({ ...m, opportunity: { _id: opportunity._id, title: opportunity.title, type: opportunity.type } })),
    nextStep,
    evaluated: ranked.evaluated,
    ms: ranked.ms,
  };
}
