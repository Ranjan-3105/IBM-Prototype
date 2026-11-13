import type { Request, Response } from "express";
import { authUser } from "../../middleware/auth";
import { GapParams, MatchesQuery } from "./matching.schema";
import * as service from "./matching.service";

export async function myMatches(req: Request, res: Response) {
  const { limit } = MatchesQuery.parse(req.query);
  res.json(await service.myMatches(authUser(req).id, limit));
}

export async function gap(req: Request, res: Response) {
  const { opportunityId } = GapParams.parse(req.params);
  res.json(await service.gapFor(authUser(req).id, opportunityId));
}
