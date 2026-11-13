import { Application } from "./application.model";
import { Opportunity } from "../opportunities/opportunity.model";
import { SkillEvidence } from "../evidence/evidence.model";
import { User } from "../users/user.model";
import { Review } from "../reviews/review.model";
import { evaluate, type OpportunityLike, type SeekerProfile } from "../matching/engine";
import { seekerContext } from "../matching/matching.service";
import { getOwned } from "../opportunities/opportunity.service";
import { HttpError } from "../../middleware/errorHandler";
import type { AppStatus } from "../common/constants";

const ALLOWED: Record<AppStatus, AppStatus[]> = {
  APPLIED: ["SHORTLISTED", "ACCEPTED", "REJECTED"],
  SHORTLISTED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["COMPLETED", "REJECTED"],
  REJECTED: [],
  COMPLETED: [],
};

export async function apply(userId: string, opportunityId: string, message: string) {
  const opp = await Opportunity.findById(opportunityId).lean();
  if (!opp) throw new HttpError(404, "Opportunity not found");
  if (opp.status !== "OPEN") throw new HttpError(400, "This opportunity is closed");
  if (await Application.exists({ opportunity: opportunityId, applicant: userId }))
    throw new HttpError(409, "You have already applied");

  const { seeker, evidenced } = await seekerContext(userId);
  const m = evaluate(seeker, opp as unknown as OpportunityLike, evidenced);
  const app = await Application.create({
    opportunity: opportunityId,
    applicant: userId,
    matchScore: m.score,
    breakdown: m.breakdown,
    message,
    status: "APPLIED",
    history: [{ status: "APPLIED", at: new Date() }],
  });
  return app;
}

export async function mine(userId: string) {
  return Application.find({ applicant: userId })
    .populate({ path: "opportunity", select: "title type isRemote area compensation hoursPerWeek status organisation", populate: { path: "organisation", select: "name orgType" } })
    .sort({ updatedAt: -1 })
    .lean();
}

/** Applicants for one opportunity, ranked by their live match score (owner only). */
export async function forOpportunity(opportunityId: string, orgId: string) {
  const opp = await getOwned(opportunityId, orgId);
  const apps = await Application.find({ opportunity: opportunityId }).lean();
  const applicantIds = apps.map((a) => a.applicant);
  const [users, evidence, reviews] = await Promise.all([
    User.find({ _id: { $in: applicantIds } }).lean(),
    SkillEvidence.find({ user: { $in: applicantIds } }).lean(),
    Review.find({ application: { $in: apps.map((a) => a._id) } }).lean(),
  ]);
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const reviewByApp = new Map(reviews.map((r) => [String(r.application), r]));

  return apps
    .map((a) => {
      const u = userById.get(String(a.applicant));
      const ev = evidence.filter((e) => String(e.user) === String(a.applicant));
      const evidenced = new Set(ev.flatMap((e) => e.skills ?? []));
      const live = u ? evaluate(u as unknown as SeekerProfile, opp.toObject() as unknown as OpportunityLike, evidenced) : null;
      return {
        ...a,
        applicant: u
          ? { _id: u._id, name: u.name, email: u.email, headline: u.headline, area: u.area, skills: u.skills, availability: u.availability, accessibilityNeeds: u.accessibilityNeeds }
          : null,
        evidence: ev,
        match: live,
        review: reviewByApp.get(String(a._id)) ?? null,
      };
    })
    .sort((x, y) => (y.match?.score ?? y.matchScore ?? 0) - (x.match?.score ?? x.matchScore ?? 0));
}

export async function setStatus(applicationId: string, orgId: string, status: AppStatus) {
  const app = await Application.findById(applicationId);
  if (!app) throw new HttpError(404, "Application not found");
  await getOwned(String(app.opportunity), orgId); // ownership check
  const current = app.status as AppStatus;
  if (current === status) return app;
  if (!ALLOWED[current].includes(status)) throw new HttpError(400, `Cannot move from ${current} to ${status}`);
  app.status = status;
  app.history.push({ status, at: new Date() });
  await app.save();
  return app;
}
