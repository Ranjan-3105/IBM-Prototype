import { performance } from "node:perf_hooks";
import { User } from "../users/user.model";
import { Opportunity } from "../opportunities/opportunity.model";
import { Application } from "../applications/application.model";
import { SkillEvidence } from "../evidence/evidence.model";
import { evaluate, keywordOnlyMatch, type OpportunityLike, type SeekerProfile } from "../matching/engine";
import { skillName } from "../../utils/skills";
import { aiEnabled } from "../../services/ai.service";

const countBy = <T extends { _id: unknown; n: number }>(rows: T[]) =>
  Object.fromEntries(rows.map((r) => [String(r._id), r.n]));

export async function stats() {
  const [usersByRole, oppsByType, oppsByStatus, appsByStatus, seekers, openOpps, evidence] = await Promise.all([
    User.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$role", n: { $sum: 1 } } }]),
    Opportunity.aggregate<{ _id: string; n: number }>([{ $match: { status: "OPEN" } }, { $group: { _id: "$type", n: { $sum: 1 } } }]),
    Opportunity.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Application.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    User.find({ role: "SEEKER" }).lean(),
    Opportunity.find({ status: "OPEN" }).lean(),
    SkillEvidence.find({}, { user: 1, skills: 1 }).lean(),
  ]);

  // Match rate: share of seekers with at least one eligible match, vs a keyword-only baseline.
  const evidenceByUser = new Map<string, Set<string>>();
  for (const e of evidence) {
    const k = String(e.user);
    const set = evidenceByUser.get(k) ?? new Set<string>();
    for (const s of e.skills ?? []) set.add(s);
    evidenceByUser.set(k, set);
  }
  const t0 = performance.now();
  let withMatch = 0;
  let withKeywordMatch = 0;
  let totalEligible = 0;
  let totalKeyword = 0;
  for (const s of seekers) {
    const profile = s as unknown as SeekerProfile;
    const results = openOpps.map((o) => evaluate(profile, o as unknown as OpportunityLike, evidenceByUser.get(String(s._id))));
    const eligible = results.filter((r) => r.eligible).length;
    totalEligible += eligible;
    if (eligible > 0) withMatch++;
    const kw = openOpps.filter((o) => keywordOnlyMatch(profile, o as unknown as OpportunityLike)).length;
    totalKeyword += kw;
    if (kw > 0) withKeywordMatch++;
  }
  const evalMs = Number((performance.now() - t0).toFixed(2));

  // Skills in demand (open opportunities) vs supply (seeker profiles).
  const demand = new Map<string, number>();
  for (const o of openOpps) for (const r of o.requiredSkills) demand.set(r.skill, (demand.get(r.skill) ?? 0) + 1);
  const supply = new Map<string, number>();
  for (const s of seekers) for (const k of s.skills) supply.set(k.skill, (supply.get(k.skill) ?? 0) + 1);
  const topDemand = await Promise.all(
    [...demand.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(async ([skill, n]) => ({ skill, name: await skillName(skill), demand: n, supply: supply.get(skill) ?? 0 }))
  );

  return {
    users: countBy(usersByRole),
    opportunities: { byType: countBy(oppsByType), byStatus: countBy(oppsByStatus) },
    applications: countBy(appsByStatus),
    matching: {
      seekers: seekers.length,
      openOpportunities: openOpps.length,
      pairsEvaluated: seekers.length * openOpps.length,
      evalMs,
      matchRate: seekers.length ? Math.round((100 * withMatch) / seekers.length) : 0,
      keywordMatchRate: seekers.length ? Math.round((100 * withKeywordMatch) / seekers.length) : 0,
      avgEligiblePerSeeker: seekers.length ? Number((totalEligible / seekers.length).toFixed(1)) : 0,
      avgKeywordPerSeeker: seekers.length ? Number((totalKeyword / seekers.length).toFixed(1)) : 0,
    },
    topDemand,
    aiEnabled: aiEnabled(),
  };
}
