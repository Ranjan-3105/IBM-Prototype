import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { Types } from "mongoose";
import { User } from "../users/user.model";
import { Opportunity } from "../opportunities/opportunity.model";
import { SkillEvidence } from "../evidence/evidence.model";
import { Match } from "./match.model";
import { evaluate, keywordOnlyMatch, type MatchResult, type OpportunityLike, type SeekerProfile } from "./engine";
import { aiEnabled, analyseGap, explainMatch } from "../../services/ai.service";
import { HttpError } from "../../middleware/errorHandler";
import { loadSkillIndex, skillName } from "../../utils/skills";

const ORG_FIELDS = "name orgType area website";

/** Seeker profile + the set of skills backed by evidence — everything the engine needs. */
export async function seekerContext(userId: string) {
  const seeker = await User.findById(userId).lean();
  if (!seeker) throw new HttpError(404, "User not found");
  const evidence = await SkillEvidence.find({ user: userId }, { skills: 1 }).lean();
  const evidenced = new Set(evidence.flatMap((e) => e.skills ?? []));
  return { seeker: seeker as unknown as SeekerProfile & { _id: Types.ObjectId }, evidenced };
}

type OppLean = OpportunityLike & { _id: Types.ObjectId; title: string; organisation?: unknown };

export async function rankForSeeker(userId: string, limit = 10) {
  const { seeker, evidenced } = await seekerContext(userId);
  const opps = (await Opportunity.find({ status: "OPEN" }).populate("organisation", ORG_FIELDS).lean()) as unknown as OppLean[];
  return rankProfile(seeker, opps, evidenced, limit);
}

/** Pure ranking over an in-memory profile (also used by the assistant with a temporary profile). */
export function rankProfile(seeker: SeekerProfile, opps: OppLean[], evidenced: Set<string>, limit = 10) {
  const t0 = performance.now();
  const results = opps.map((o) => evaluate(seeker, o, evidenced));
  const ms = Number((performance.now() - t0).toFixed(2)); // ← shown in the demo

  const byId = new Map(opps.map((o) => [String(o._id), o]));
  const withOpp = (m: MatchResult) => ({ ...m, opportunity: byId.get(m.opportunityId)! });

  const eligible = results.filter((m) => m.eligible).sort((a, b) => b.score - a.score);
  const matches = eligible.slice(0, limit).map(withOpp);
  const nearMisses = results
    .filter((m) => !m.eligible && m.breakdown.S >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(withOpp);
  const keywordBaseline = opps.filter((o) => keywordOnlyMatch(seeker, o)).length;

  return { matches, nearMisses, evaluated: opps.length, eligibleCount: eligible.length, keywordBaseline, ms };
}

const fingerprint = (m: MatchResult, title: string) =>
  createHash("sha1")
    .update(JSON.stringify([title, m.score, m.breakdown, m.matchedSkills, m.missingSkills, m.distanceKm]))
    .digest("hex");

async function namer() {
  await loadSkillIndex();
  const cache = new Map<string, string>();
  return async (slugs: string[]) => {
    for (const s of slugs) if (!cache.has(s)) cache.set(s, await skillName(s));
    return (s: string) => cache.get(s) ?? s;
  };
}

/** Adds an explanation to each match, re-using the Match cache when inputs have not changed. */
export async function explainAll(userId: string | null, matches: (MatchResult & { opportunity: OppLean })[]) {
  const getNames = await namer();
  const names = await getNames(matches.flatMap((m) => [...m.matchedSkills, ...m.missingSkills.map((x) => x.skill)]));
  const cached = userId
    ? await Match.find({ user: userId, opportunity: { $in: matches.map((m) => m.opportunityId) } }).lean()
    : [];
  const cacheById = new Map(cached.map((c) => [String(c.opportunity), c]));

  return Promise.all(
    matches.map(async (m) => {
      const fp = fingerprint(m, m.opportunity.title);
      const hit = cacheById.get(m.opportunityId);
      // Re-use the cache unless it holds a template from a recent AI failure that may now succeed.
      const retryAi = hit?.explanationSource === "TEMPLATE" && aiEnabled() && Date.now() - +new Date(hit.computedAt ?? 0) > 10 * 60_000;
      if (hit?.fingerprint === fp && hit.explanation && !retryAi) {
        return { ...m, explanation: hit.explanation, explanationSource: hit.explanationSource ?? "TEMPLATE" };
      }
      const { text, source } = await explainMatch(m, m.opportunity.title, names);
      if (userId) {
        await Match.updateOne(
          { user: userId, opportunity: m.opportunityId },
          {
            $set: {
              score: m.score,
              breakdown: m.breakdown,
              matchedSkills: m.matchedSkills,
              missingSkills: m.missingSkills,
              explanation: text,
              explanationSource: source,
              fingerprint: fp,
              computedAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
      return { ...m, explanation: text, explanationSource: source };
    })
  );
}

export async function myMatches(userId: string, limit: number) {
  const ranked = await rankForSeeker(userId, limit);
  const matches = await explainAll(userId, ranked.matches);
  return { ...ranked, matches };
}

export async function gapFor(userId: string, opportunityId: string) {
  if (!Types.ObjectId.isValid(opportunityId)) throw new HttpError(400, "Invalid opportunity id");
  const { seeker, evidenced } = await seekerContext(userId);
  const opp = (await Opportunity.findById(opportunityId).populate("organisation", ORG_FIELDS).lean()) as unknown as OppLean | null;
  if (!opp) throw new HttpError(404, "Opportunity not found");

  const result = evaluate(seeker, opp, evidenced);
  const ranked = await rankForSeeker(userId, 4);
  const alternatives = ranked.matches
    .filter((m) => m.opportunityId !== opportunityId)
    .slice(0, 3)
    .map((m) => ({
      opportunityId: m.opportunityId,
      title: m.opportunity.title,
      score: m.score,
      type: m.opportunity.type,
      isRemote: m.opportunity.isRemote,
    }));

  const getNames = await namer();
  const name = await getNames([...result.matchedSkills, ...result.missingSkills.map((s) => s.skill)]);
  const analysis = await analyseGap({
    title: opp.title,
    matchedSkills: result.matchedSkills.map(name),
    missingSkills: result.missingSkills.map((s) => ({ ...s, skill: name(s.skill) })),
    blockers: result.blockers.map((b) => b.replace(/skill: ([a-z0-9-]+)$/, (_, slug: string) => `skill: ${name(slug)}`)),
    alternatives: alternatives.map((a) => ({ title: a.title, score: a.score })),
  });

  return { opportunity: opp, result, alternatives, analysis };
}
