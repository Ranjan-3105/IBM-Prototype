import type { z } from "zod";
import { SkillEvidence } from "./evidence.model";
import { User } from "../users/user.model";
import { Application } from "../applications/application.model";
import { Opportunity } from "../opportunities/opportunity.model";
import { HttpError } from "../../middleware/errorHandler";
import { normaliseSkills } from "../../utils/skills";
import type { CreateEvidenceSchema } from "./evidence.schema";

export async function create(userId: string, input: z.infer<typeof CreateEvidenceSchema>) {
  const { slugs, unknown } = await normaliseSkills(input.skills);
  if (unknown.length) throw new HttpError(400, `Unknown skills: ${unknown.join(", ")}`);
  return SkillEvidence.create({ ...input, url: input.url || undefined, skills: slugs, user: userId });
}

export async function mine(userId: string) {
  return SkillEvidence.find({ user: userId }).populate("endorsedBy", "name orgType").sort({ createdAt: -1 }).lean();
}

export async function remove(userId: string, id: string) {
  const ev = await SkillEvidence.findById(id);
  if (!ev) throw new HttpError(404, "Evidence not found");
  if (String(ev.user) !== userId) throw new HttpError(403, "Not your evidence");
  await ev.deleteOne();
}

/** Marks the given skills on a seeker as ENDORSED (adding them at level 2 if absent). */
export async function endorseSkills(userId: string, slugs: string[]) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");
  const skills = user.skills.map((s) => ({ skill: s.skill, level: s.level, source: s.source }));
  for (const slug of slugs) {
    const existing = skills.find((s) => s.skill === slug);
    if (existing) existing.source = "ENDORSED";
    else skills.push({ skill: slug, level: 2, source: "ENDORSED" });
  }
  user.set("skills", skills);
  await user.save();
}

/** An organisation may endorse evidence from someone it has accepted or completed work with. */
export async function endorse(orgId: string, evidenceId: string) {
  const ev = await SkillEvidence.findById(evidenceId);
  if (!ev) throw new HttpError(404, "Evidence not found");
  const myOpps = await Opportunity.find({ organisation: orgId }, { _id: 1 }).lean();
  const workedTogether = await Application.exists({
    applicant: ev.user,
    opportunity: { $in: myOpps.map((o) => o._id) },
    status: { $in: ["ACCEPTED", "COMPLETED"] },
  });
  if (!workedTogether)
    throw new HttpError(403, "You can only endorse people you have accepted for one of your opportunities");
  ev.endorsedBy = orgId as unknown as typeof ev.endorsedBy;
  ev.endorsedAt = new Date();
  await ev.save();
  await endorseSkills(String(ev.user), ev.skills);
  return ev.populate("endorsedBy", "name orgType");
}
