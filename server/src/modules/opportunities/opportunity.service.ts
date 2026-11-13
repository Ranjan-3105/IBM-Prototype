import type { z } from "zod";
import { Opportunity } from "./opportunity.model";
import { User } from "../users/user.model";
import { Application } from "../applications/application.model";
import { HttpError } from "../../middleware/errorHandler";
import { normaliseSkill } from "../../utils/skills";
import { parseLngLat } from "../../utils/geo";
import type { CreateOpportunitySchema, ListOpportunitiesQuery, UpdateOpportunitySchema } from "./opportunity.schema";

const ORG_FIELDS = "name orgType area website";
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function normaliseRequired(req: { skill: string; minLevel: number; mandatory: boolean }[]) {
  const out = new Map<string, { skill: string; minLevel: number; mandatory: boolean }>();
  const unknown: string[] = [];
  for (const r of req) {
    const slug = await normaliseSkill(r.skill);
    if (!slug) unknown.push(r.skill);
    else out.set(slug, { ...r, skill: slug });
  }
  if (unknown.length) throw new HttpError(400, `Unknown skills: ${unknown.join(", ")}`);
  return [...out.values()];
}

export async function create(orgId: string, input: z.infer<typeof CreateOpportunitySchema>) {
  const org = await User.findById(orgId).lean();
  if (!org) throw new HttpError(404, "Organisation not found");
  const { location, ...rest } = input;
  const opp = await Opportunity.create({
    ...rest,
    organisation: orgId,
    requiredSkills: await normaliseRequired(input.requiredSkills),
    area: input.area ?? org.area,
    // on-site roles default to the organisation's own location
    location: { type: "Point", coordinates: location?.coordinates ?? org.location?.coordinates },
  });
  return opp.populate("organisation", ORG_FIELDS);
}

export async function list(query: z.infer<typeof ListOpportunitiesQuery>) {
  const filter: Record<string, unknown> = {};
  if (query.status !== "ALL") filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.remote !== undefined) filter.isRemote = query.remote;
  if (query.skill) {
    const slug = await normaliseSkill(query.skill);
    filter["requiredSkills.skill"] = slug ?? "__none__";
  }
  const and: Record<string, unknown>[] = [];
  if (query.q) {
    const re = new RegExp(escapeRe(query.q), "i");
    and.push({ $or: [{ title: re }, { description: re }, { area: re }] });
  }
  if (query.near) {
    const point = parseLngLat(query.near);
    if (!point) throw new HttpError(400, "near must be 'lng,lat'");
    // $near is not allowed inside $or, so use $geoWithin + $centerSphere
    and.push({
      $or: [{ isRemote: true }, { location: { $geoWithin: { $centerSphere: [point, query.km / 6378.1] } } }],
    });
  }
  if (and.length) filter.$and = and;
  return Opportunity.find(filter).populate("organisation", ORG_FIELDS).sort({ createdAt: -1 }).limit(query.limit).lean();
}

export async function mine(orgId: string) {
  const opps = await Opportunity.find({ organisation: orgId }).sort({ createdAt: -1 }).lean();
  const counts = await Application.aggregate<{ _id: unknown; total: number; pending: number }>([
    { $match: { opportunity: { $in: opps.map((o) => o._id) } } },
    {
      $group: {
        _id: "$opportunity",
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", "APPLIED"] }, 1, 0] } },
      },
    },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c]));
  return opps.map((o) => ({
    ...o,
    applicantCount: byId.get(String(o._id))?.total ?? 0,
    pendingCount: byId.get(String(o._id))?.pending ?? 0,
  }));
}

export async function getById(id: string) {
  const opp = await Opportunity.findById(id).populate("organisation", ORG_FIELDS).lean();
  if (!opp) throw new HttpError(404, "Opportunity not found");
  return opp;
}

/** Loads an opportunity and checks the caller owns it. */
export async function getOwned(id: string, orgId: string) {
  const opp = await Opportunity.findById(id);
  if (!opp) throw new HttpError(404, "Opportunity not found");
  if (String(opp.organisation) !== orgId) throw new HttpError(403, "You do not own this opportunity");
  return opp;
}

export async function update(id: string, orgId: string, input: z.infer<typeof UpdateOpportunitySchema>) {
  const opp = await getOwned(id, orgId);
  const { location, requiredSkills, ...rest } = input;
  opp.set(rest);
  if (requiredSkills) opp.set("requiredSkills", await normaliseRequired(requiredSkills));
  if (location) opp.set("location", { type: "Point", coordinates: location.coordinates });
  await opp.save();
  return opp.populate("organisation", ORG_FIELDS);
}
