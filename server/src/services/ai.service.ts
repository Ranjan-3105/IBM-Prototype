import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "../config/env";
import { withTimeout } from "../utils/timeout";
import { OPP_TYPES } from "../modules/common/constants";
import type { MatchResult } from "../modules/matching/engine";

/**
 * Gemini does three jobs — extract, explain, suggest. None of them computes a score.
 * Every call: timeout → zod-validated output → deterministic fallback on any failure.
 */
let client: GoogleGenAI | null = null;
const getClient = () => {
  if (!env.GEMINI_API_KEY) return null;
  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
};
export const aiEnabled = () => !!env.GEMINI_API_KEY;

function logAiFailure(where: string, err: unknown) {
  // Never log the key or full payloads — just the reason.
  const msg = err instanceof Error ? err.message.slice(0, 200) : "unknown error";
  console.warn(`[ai] ${where} fell back to template: ${msg}`);
}

/** Calls Gemini with a JSON schema and validates the reply with the same zod schema. */
async function generateJson<T extends z.ZodType>(schema: T, prompt: string, ms = 15000): Promise<z.infer<T>> {
  const ai = getClient();
  if (!ai) throw new Error("GEMINI_API_KEY not set");
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;
  const res = await withTimeout(
    ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", responseJsonSchema: jsonSchema, temperature: 0.2 },
    }),
    ms
  );
  return schema.parse(JSON.parse(res.text ?? ""));
}

async function generateText(prompt: string, ms = 12000): Promise<string> {
  const ai = getClient();
  if (!ai) throw new Error("GEMINI_API_KEY not set");
  const res = await withTimeout(
    ai.models.generateContent({ model: env.GEMINI_MODEL, contents: prompt, config: { temperature: 0.4 } }),
    ms
  );
  const text = (res.text ?? "").trim();
  if (!text) throw new Error("empty AI response");
  return text;
}

// ── 1. Skill DNA extraction ──────────────────────────────────────────────
export const ExtractedProfile = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      level: z.number().int().min(1).max(5),
      evidence: z.string(),
    })
  ),
  hoursPerWeek: z.number().nullable(),
  remoteOnly: z.boolean().nullable(),
  preferredTypes: z.array(z.enum(OPP_TYPES)),
});
export type ExtractedProfileT = z.infer<typeof ExtractedProfile>;

export interface CatalogueTerms {
  slug: string;
  terms: string[];
}

export async function extractProfile(
  text: string,
  catalogue: CatalogueTerms[]
): Promise<ExtractedProfileT & { source: "AI" | "FALLBACK" }> {
  try {
    const out = await generateJson(
      ExtractedProfile,
      `You extract a skill profile for an opportunity-matching platform.
Use skill names from this catalogue whenever possible: ${catalogue.map((c) => c.slug).join(", ")}.
Level scale: 1 = heard of it, 2 = beginner, 3 = can build small things alone, 4 = strong, 5 = expert.
Be conservative: with no evidence of real use, choose level 2 or lower.
"evidence" must be a short phrase copied from the text. Do not invent skills.
Convert daily hours to hours per week. Use null when something is not stated.
preferredTypes must only use: ${OPP_TYPES.join(", ")}.

TEXT:
"""${text}"""`
    );
    return { ...out, source: "AI" };
  } catch (err) {
    if (aiEnabled()) logAiFailure("extractProfile", err);
    return { ...fallbackExtract(text, catalogue), source: "FALLBACK" };
  }
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Deterministic extractor: catalogue keyword scan + simple patterns for hours, remote and types. */
export function fallbackExtract(text: string, catalogue: CatalogueTerms[]): ExtractedProfileT {
  const lower = text.toLowerCase();
  const skills: ExtractedProfileT["skills"] = [];

  for (const c of catalogue) {
    for (const term of c.terms) {
      const t = term.toLowerCase().trim();
      if (t.length < 2) continue;
      // word boundaries that also treat ".", "+", "#" as part of a token (so "java" ≠ "javascript")
      const re = new RegExp(`(^|[^a-z0-9+#.])${escapeRe(t)}(?=$|[^a-z0-9+#]|\\.(?![a-z]))`, "i");
      const m = re.exec(lower);
      if (!m) continue;
      // Only the clause around the skill counts ("basic SQL" must not downgrade "Java" earlier in the sentence).
      const at = m.index + (m[1]?.length ?? 0);
      const before = lower.slice(Math.max(0, at - 30), at).split(/[,;.!?]| and | or /).pop() ?? "";
      const after = lower.slice(at + t.length, at + t.length + 40).split(/[,;.!?]| and /)[0] ?? "";
      const clause = `${before} ${after}`;
      let level = 2;
      if (/\b(basic|basics|beginner|learning|little|some)\b/.test(clause)) level = 1;
      if (/\b(built|developed|made|project|projects|internship|worked)\b/.test(clause)) level = 3;
      if (/\b(strong|expert|advanced|professional|years)\b/.test(clause)) level = 4;
      skills.push({ name: c.slug, level, evidence: text.slice(at, at + t.length) });
      break;
    }
  }

  let hoursPerWeek: number | null = null;
  const perDay = /(\d+(?:\.\d+)?)\s*(?:-|to)?\s*(?:hours?|hrs?|h)\s*(?:a|per|\/|each)\s*day/i.exec(text);
  const perWeek = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*(?:a|per|\/|each)\s*week/i.exec(text);
  if (perWeek?.[1]) hoursPerWeek = Math.round(Number(perWeek[1]));
  else if (perDay?.[1]) {
    const weekdaysOnly = /weekday/i.test(text);
    hoursPerWeek = Math.round(Number(perDay[1]) * (weekdaysOnly ? 5 : 7));
  } else if (/weekends?\s+only|only\s+(?:on\s+)?weekends?/i.test(text)) hoursPerWeek = 8;

  let remoteOnly: boolean | null = null;
  if (/\b(remote only|only remote|prefer remote|remote work|work from home|wfh|online only)\b/i.test(text)) remoteOnly = true;
  if (/\b(on-?site is fine|can travel|in person|offline)\b/i.test(text)) remoteOnly = false;

  const preferredTypes: ExtractedProfileT["preferredTypes"] = [];
  const typeWords: [RegExp, (typeof OPP_TYPES)[number]][] = [
    [/intern/i, "INTERNSHIP"],
    [/part[- ]?time/i, "PART_TIME"],
    [/freelanc|gig/i, "FREELANCE"],
    [/volunteer|ngo|give back/i, "VOLUNTEER"],
    [/community/i, "COMMUNITY_PROJECT"],
  ];
  for (const [re, t] of typeWords) if (re.test(text)) preferredTypes.push(t);

  return { skills, hoursPerWeek, remoteOnly, preferredTypes };
}

// ── 2. Match explanation ─────────────────────────────────────────────────
export async function explainMatch(
  m: MatchResult,
  opportunityTitle: string,
  names: (slug: string) => string = (s) => s
): Promise<{ text: string; source: "AI" | "TEMPLATE" }> {
  if (!aiEnabled()) return { text: fallbackExplanation(m, opportunityTitle, names), source: "TEMPLATE" };
  try {
    const facts = {
      score: m.score,
      breakdown: m.breakdown,
      matchedSkills: m.matchedSkills.map(names),
      missingSkills: m.missingSkills.map((s) => ({ ...s, skill: names(s.skill) })),
      distanceKm: m.distanceKm,
      blockers: m.blockers,
    };
    const text = await generateText(
      `Explain to a student/job-seeker, in 2–3 friendly sentences, why "${opportunityTitle}" fits them.
Use ONLY these computed facts; do not change or recompute the score (it is ${m.score}%):
${JSON.stringify(facts)}
Breakdown keys: S=skills, A=availability, L=location, E=evidence, P=preferences/accessibility (each 0–100).
Mention matched skills, one missing skill (if any) and one way to improve. Plain text, no markdown.`
    );
    return { text, source: "AI" };
  } catch (err) {
    logAiFailure("explainMatch", err);
    return { text: fallbackExplanation(m, opportunityTitle, names), source: "TEMPLATE" };
  }
}

export function fallbackExplanation(m: MatchResult, title: string, names: (slug: string) => string = (s) => s) {
  const has = m.matchedSkills.map(names).join(", ") || "some of the required skills";
  const gap = m.missingSkills[0];
  const where = m.distanceKm === null ? "" : ` It is ${m.distanceKm} km from you.`;
  return (
    `${title} is a ${m.score}% match. You already have ${has}.${where}` +
    (gap ? ` Improving ${names(gap.skill)} (to level ${gap.needed}) would make you a stronger candidate.` : "")
  );
}

// ── 3. Opportunity Gap Analyzer ──────────────────────────────────────────
export const GapAnalysis = z.object({
  summary: z.string(),
  learnNext: z.array(z.object({ skill: z.string(), why: z.string(), firstStep: z.string() })).max(3),
});
export type GapAnalysisT = z.infer<typeof GapAnalysis>;

export async function analyseGap(input: {
  title: string;
  matchedSkills: string[];
  missingSkills: MatchResult["missingSkills"];
  blockers: string[];
  alternatives: { title: string; score: number }[];
}): Promise<GapAnalysisT & { source: "AI" | "TEMPLATE" }> {
  if (aiEnabled()) {
    try {
      const out = await generateJson(
        GapAnalysis,
        `A user does not fully qualify for "${input.title}". Using ONLY these facts:
${JSON.stringify(input)}
Write an encouraging one-paragraph summary (what they have, what's missing, which alternatives they
already qualify for), then up to 3 skills to learn next with a concrete, free first step each.
Do not mention or change any score other than the ones given.`
      );
      return { ...out, source: "AI" };
    } catch (err) {
      logAiFailure("analyseGap", err);
    }
  }
  return { ...fallbackGap(input), source: "TEMPLATE" };
}

export function fallbackGap(input: Parameters<typeof analyseGap>[0]): GapAnalysisT {
  const alt = input.alternatives.length
    ? ` Meanwhile you already qualify for ${input.alternatives.map((a) => `${a.title} (${a.score}%)`).join(", ")}.`
    : "";
  return {
    summary:
      `You match on ${input.matchedSkills.join(", ") || "part of this role"}. ` +
      `Missing: ${input.missingSkills.map((s) => s.skill).join(", ") || "no skills"}.` +
      (input.blockers.length ? ` Other blockers: ${input.blockers.join("; ")}.` : "") +
      alt,
    learnNext: input.missingSkills.slice(0, 3).map((s) => ({
      skill: s.skill,
      why: s.mandatory ? "Mandatory for this role" : "Raises your match score",
      firstStep: `Build one small project using ${s.skill} and add it as evidence.`,
    })),
  };
}
