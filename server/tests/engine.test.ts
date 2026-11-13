import { describe, expect, it } from "vitest";
import { evaluate, keywordOnlyMatch, WEIGHTS, type OpportunityLike, type SeekerProfile } from "../src/modules/matching/engine";
import { buildSkillIndex, toKey } from "../src/utils/skills";
import { SKILL_CATALOGUE } from "../src/modules/skills/catalogue";
import { fallbackExtract, fallbackExplanation } from "../src/services/ai.service";

const PATIA = [85.818, 20.354];
const OLD_TOWN = [85.835, 20.24];

const opp = (o: Partial<OpportunityLike> = {}): OpportunityLike => ({
  _id: "opp1",
  type: "INTERNSHIP",
  requiredSkills: [
    { skill: "react", minLevel: 3, mandatory: true },
    { skill: "nodejs", minLevel: 2, mandatory: false },
  ],
  isRemote: false,
  location: { coordinates: PATIA },
  hoursPerWeek: 10,
  compensation: { kind: "STIPEND" },
  accessibilityProvided: [],
  ...o,
});

const seeker = (s: Partial<SeekerProfile> = {}): SeekerProfile => ({
  skills: [
    { skill: "react", level: 3 },
    { skill: "nodejs", level: 2 },
  ],
  location: { coordinates: PATIA },
  availability: { hoursPerWeek: 14, remoteOnly: false, maxTravelKm: 15 },
  accessibilityNeeds: [],
  preferences: { types: ["INTERNSHIP"], paidOnly: false },
  ...s,
});

describe("matching engine", () => {
  it("weights sum to 1", () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("a remote-only seeker never sees on-site roles", () => {
    const m = evaluate(seeker({ availability: { hoursPerWeek: 14, remoteOnly: true, maxTravelKm: 15 } }), opp());
    expect(m.eligible).toBe(false);
    expect(m.blockers).toContain("On-site role; you prefer remote only");
    const remote = evaluate(seeker({ availability: { hoursPerWeek: 14, remoteOnly: true, maxTravelKm: 15 } }), opp({ isRemote: true }));
    expect(remote.eligible).toBe(true);
  });

  it("a missing mandatory skill → ineligible, and the blocker names the skill", () => {
    const m = evaluate(seeker({ skills: [{ skill: "nodejs", level: 3 }] }), opp());
    expect(m.eligible).toBe(false);
    expect(m.blockers).toContain("Missing mandatory skill: react");
    expect(m.missingSkills).toEqual([{ skill: "react", needed: 3, have: 0, mandatory: true }]);
  });

  it("unmet accessibility need blocks an on-site role but not the same role when remote", () => {
    const s = seeker({ accessibilityNeeds: ["WHEELCHAIR_ACCESS"] });
    const onsite = evaluate(s, opp());
    expect(onsite.eligible).toBe(false);
    expect(onsite.blockers.join(" ")).toMatch(/WHEELCHAIR_ACCESS/);
    expect(evaluate(s, opp({ isRemote: true })).eligible).toBe(true);
    expect(evaluate(s, opp({ accessibilityProvided: ["WHEELCHAIR_ACCESS"] })).eligible).toBe(true);
  });

  it("a perfect seeker scores close to 100", () => {
    const m = evaluate(
      seeker({ skills: [{ skill: "react", level: 5, source: "ENDORSED" }, { skill: "nodejs", level: 5, source: "ENDORSED" }] }),
      opp()
    );
    expect(m.eligible).toBe(true);
    expect(m.score).toBeGreaterThanOrEqual(95);
    expect(m.breakdown).toEqual({ S: 100, A: 100, L: 100, E: 100, P: 100 });
  });

  it("evidence raises the E component and the score", () => {
    const without = evaluate(seeker(), opp());
    const withEv = evaluate(seeker(), opp(), new Set(["react"]));
    expect(withEv.breakdown.E).toBe(50);
    expect(withEv.score).toBeGreaterThan(without.score);
  });

  it("too far away → blocked with the distance", () => {
    const m = evaluate(seeker({ availability: { hoursPerWeek: 14, remoteOnly: false, maxTravelKm: 5 } }), opp({ location: { coordinates: OLD_TOWN } }));
    expect(m.eligible).toBe(false);
    expect(m.distanceKm).toBeGreaterThan(5);
  });

  it("paid-only seeker is blocked from unpaid roles", () => {
    const m = evaluate(seeker({ preferences: { types: [], paidOnly: true } }), opp({ compensation: { kind: "UNPAID" } }));
    expect(m.blockers).toContain("Unpaid role; you are looking for paid work");
  });

  it("handles edge cases: no skills, no location, zero hours, empty requiredSkills", () => {
    const m = evaluate({ skills: [] }, opp({ requiredSkills: [], location: null }));
    expect(Number.isFinite(m.score)).toBe(true);
    expect(m.breakdown.S).toBe(100);
    expect(m.breakdown.A).toBe(0);
    expect(m.blockers[0]).toMatch(/h\/week/);
    const zero = evaluate(seeker(), opp({ hoursPerWeek: 0 }));
    expect(Number.isFinite(zero.score)).toBe(true);
  });

  it("partial skill level gives partial credit", () => {
    const m = evaluate(seeker({ skills: [{ skill: "react", level: 2 }, { skill: "nodejs", level: 2 }] }), opp());
    expect(m.missingSkills.map((x) => x.skill)).toEqual(["react"]);
    expect(m.breakdown.S).toBe(78); // (2·2/3 + 1·1) / 3
  });

  it("keyword-only baseline requires every skill listed", () => {
    expect(keywordOnlyMatch(seeker(), opp())).toBe(true);
    expect(keywordOnlyMatch(seeker({ skills: [{ skill: "react", level: 5 }] }), opp())).toBe(false);
  });
});

describe("skill normalisation", () => {
  const index = buildSkillIndex(SKILL_CATALOGUE);
  const norm = (raw: string) => index.get(toKey(raw)) ?? null;

  it('"React.js", "ReactJS" and "react" normalise to the same slug', () => {
    expect(norm("React.js")).toBe("react");
    expect(norm("ReactJS")).toBe("react");
    expect(norm("react")).toBe("react");
  });

  it("maps common aliases and rejects unknown skills", () => {
    expect(norm("Node")).toBe("nodejs");
    expect(norm("node.js")).toBe("nodejs");
    expect(norm("Mongo")).toBe("mongodb");
    expect(norm("JS")).toBe("javascript");
    expect(norm("basket weaving")).toBeNull();
  });

  it("catalogue keys are unambiguous", () => {
    const seen = new Map<string, string>();
    for (const s of SKILL_CATALOGUE)
      for (const k of [s.slug, s.name, ...s.aliases].map(toKey)) {
        const prev = seen.get(k);
        expect(prev === undefined || prev === s.slug, `${k} → ${prev} and ${s.slug}`).toBe(true);
        seen.set(k, s.slug);
      }
  });
});

describe("AI fallbacks (no API key needed)", () => {
  const catalogue = SKILL_CATALOGUE.map((s) => ({ slug: s.slug, terms: [s.name, s.slug, ...s.aliases] }));

  it("extracts the demo sentence deterministically", () => {
    const out = fallbackExtract(
      "I'm a 2nd-year engineering student, I know Java, React and basic SQL, I can work 2 hours a day, I prefer remote work and I have no experience.",
      catalogue
    );
    const slugs = out.skills.map((s) => s.name).sort();
    expect(slugs).toEqual(["java", "react", "sql"]);
    expect(out.skills.find((s) => s.name === "javascript")).toBeUndefined();
    expect(out.skills.find((s) => s.name === "sql")?.level).toBe(1); // "basic SQL"
    expect(out.skills.find((s) => s.name === "java")?.level).toBe(2); // not downgraded by "basic" later on
    expect(out.hoursPerWeek).toBe(14);
    expect(out.remoteOnly).toBe(true);
  });

  it("template explanation states the computed score", () => {
    const m = evaluate(seeker(), opp());
    expect(fallbackExplanation(m, "Web intern")).toContain(`${m.score}% match`);
  });
});
