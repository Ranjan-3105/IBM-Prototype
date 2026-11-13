import type { Opportunity } from "@/types";

export const orgName = (opp: Opportunity) => (typeof opp.organisation === "string" ? "" : opp.organisation?.name ?? "");

/** "Missing mandatory skill: nodejs" → "Missing mandatory skill: Node.js" */
export const prettyBlocker = (b: string, nameOf: (slug: string) => string) =>
  b.replace(/skill: ([a-z0-9-]+)$/, (_, slug: string) => `skill: ${nameOf(slug)}`);
