import { haversineKm } from "../../utils/geo";

/**
 * SkillBridge matching engine — the ONLY place a match score is computed.
 *   M = 0.40·S + 0.20·A + 0.15·L + 0.15·E + 0.10·P   (each part 0–100)
 * Plain deterministic TypeScript: fast, testable and explainable. The LLM only explains the result.
 */
export const WEIGHTS = { S: 0.4, A: 0.2, L: 0.15, E: 0.15, P: 0.1 } as const;

export interface SeekerProfile {
  skills: { skill: string; level: number; source?: string | null }[];
  location?: { coordinates: number[] } | null;
  availability?: { hoursPerWeek?: number | null; remoteOnly?: boolean | null; maxTravelKm?: number | null } | null;
  accessibilityNeeds?: string[] | null;
  preferences?: { types?: string[] | null; paidOnly?: boolean | null } | null;
}

export interface OpportunityLike {
  _id: unknown;
  type: string;
  requiredSkills: { skill: string; minLevel?: number | null; mandatory?: boolean | null }[];
  isRemote?: boolean | null;
  location?: { coordinates: number[] } | null;
  hoursPerWeek: number;
  compensation?: { kind?: string | null } | null;
  accessibilityProvided?: string[] | null;
}

export interface MissingSkill {
  skill: string;
  needed: number;
  have: number;
  mandatory: boolean;
}

export interface Breakdown {
  S: number;
  A: number;
  L: number;
  E: number;
  P: number;
}

export interface MatchResult {
  opportunityId: string;
  eligible: boolean; // passed all hard filters
  blockers: string[]; // why not eligible (used by the Gap Analyzer)
  score: number; // 0–100
  breakdown: Breakdown;
  matchedSkills: string[];
  missingSkills: MissingSkill[];
  distanceKm: number | null;
}

const r = (n: number) => Math.round(n);
const hasCoords = (p?: { coordinates: number[] } | null) =>
  !!p && Array.isArray(p.coordinates) && p.coordinates.length === 2 && p.coordinates.every(Number.isFinite);

export function evaluate(
  seeker: SeekerProfile,
  opp: OpportunityLike,
  evidencedSkills: Set<string> = new Set()
): MatchResult {
  const blockers: string[] = [];
  const mySkills = new Map((seeker.skills ?? []).map((s) => [s.skill, s]));
  const hours = Math.max(0, seeker.availability?.hoursPerWeek ?? 0);
  const maxKm = Math.max(1, seeker.availability?.maxTravelKm ?? 15);
  const isRemote = !!opp.isRemote;
  const oppHours = Math.max(1, opp.hoursPerWeek || 1);
  const distanceKm =
    !isRemote && hasCoords(seeker.location) && hasCoords(opp.location)
      ? haversineKm(seeker.location!.coordinates, opp.location!.coordinates)
      : null;

  // ── Step 1: hard filters ─────────────────────────────────────────────
  if (hours < oppHours * 0.5) blockers.push(`Needs ~${oppHours} h/week; you have ${hours} h`);

  if (!isRemote) {
    if (seeker.availability?.remoteOnly) blockers.push("On-site role; you prefer remote only");
    else if (distanceKm !== null && distanceKm > maxKm)
      blockers.push(`${distanceKm.toFixed(1)} km away (your limit: ${maxKm} km)`);
  }

  if (seeker.preferences?.paidOnly && (opp.compensation?.kind ?? "UNPAID") === "UNPAID")
    blockers.push("Unpaid role; you are looking for paid work");

  const provided = new Set(opp.accessibilityProvided ?? []);
  const unmetAccess = (seeker.accessibilityNeeds ?? []).filter((n) => !provided.has(n));
  if (!isRemote && unmetAccess.length) blockers.push(`Accessibility not provided: ${unmetAccess.join(", ")}`);

  // ── Step 2: weighted score ───────────────────────────────────────────
  let wTotal = 0;
  let wGot = 0;
  const matchedSkills: string[] = [];
  const missingSkills: MissingSkill[] = [];

  for (const req of opp.requiredSkills ?? []) {
    const minLevel = Math.max(1, req.minLevel ?? 2);
    const mandatory = !!req.mandatory;
    const w = mandatory ? 2 : 1;
    const have = mySkills.get(req.skill)?.level ?? 0;
    wTotal += w;
    wGot += w * Math.min(have / minLevel, 1);
    if (have >= minLevel) matchedSkills.push(req.skill);
    else missingSkills.push({ skill: req.skill, needed: minLevel, have, mandatory });
    if (mandatory && have === 0) blockers.push(`Missing mandatory skill: ${req.skill}`);
  }

  const S = wTotal ? (100 * wGot) / wTotal : 100;
  const A = 100 * Math.min(hours / oppHours, 1);
  const L = isRemote ? 100 : distanceKm === null ? 50 : 100 * Math.max(0, 1 - distanceKm / maxKm);

  const reqCount = opp.requiredSkills?.length ?? 0;
  const evidenced = (opp.requiredSkills ?? []).filter(
    (q) => evidencedSkills.has(q.skill) || mySkills.get(q.skill)?.source === "ENDORSED"
  ).length;
  const E = reqCount ? (100 * evidenced) / reqCount : 100;

  const prefTypes = seeker.preferences?.types ?? [];
  const typeFit = prefTypes.length === 0 ? 40 : prefTypes.includes(opp.type) ? 60 : 20;
  const accessFit = isRemote || unmetAccess.length === 0 ? 40 : 0;
  const P = typeFit + accessFit;

  const score = r(WEIGHTS.S * S + WEIGHTS.A * A + WEIGHTS.L * L + WEIGHTS.E * E + WEIGHTS.P * P);

  return {
    opportunityId: String(opp._id),
    eligible: blockers.length === 0,
    blockers,
    score,
    breakdown: { S: r(S), A: r(A), L: r(L), E: r(E), P: r(P) },
    matchedSkills,
    missingSkills,
    distanceKm: distanceKm === null ? null : Number(distanceKm.toFixed(1)),
  };
}

/** Naive "job-portal" baseline for the demo: only counts roles where every required skill is listed. */
export function keywordOnlyMatch(seeker: SeekerProfile, opp: OpportunityLike) {
  const mine = new Set((seeker.skills ?? []).map((s) => s.skill));
  return (opp.requiredSkills ?? []).length > 0 && opp.requiredSkills.every((q) => mine.has(q.skill));
}
