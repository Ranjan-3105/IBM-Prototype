import type { z } from "zod";
import { Review } from "./review.model";
import { Application } from "../applications/application.model";
import { getOwned } from "../opportunities/opportunity.service";
import { endorseSkills } from "../evidence/evidence.service";
import { HttpError } from "../../middleware/errorHandler";
import { normaliseSkills } from "../../utils/skills";
import type { CreateReviewSchema } from "./review.schema";

export async function create(orgId: string, input: z.infer<typeof CreateReviewSchema>) {
  const app = await Application.findById(input.applicationId);
  if (!app) throw new HttpError(404, "Application not found");
  await getOwned(String(app.opportunity), orgId);
  if (!["ACCEPTED", "COMPLETED"].includes(app.status))
    throw new HttpError(400, "You can review only accepted or completed work");
  if (await Review.exists({ application: app._id })) throw new HttpError(409, "Already reviewed");

  const { slugs, unknown } = await normaliseSkills(input.verifiedSkills);
  if (unknown.length) throw new HttpError(400, `Unknown skills: ${unknown.join(", ")}`);

  const review = await Review.create({
    application: app._id,
    reviewer: orgId,
    reviewee: app.applicant,
    rating: input.rating,
    comment: input.comment,
    verifiedSkills: slugs,
  });
  if (slugs.length) await endorseSkills(String(app.applicant), slugs); // verified skill → ENDORSED
  return review;
}

export async function aboutMe(userId: string) {
  return Review.find({ reviewee: userId }).populate("reviewer", "name orgType").sort({ createdAt: -1 }).lean();
}
