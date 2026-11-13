import type { Request, Response } from "express";
import { authUser } from "../../middleware/auth";
import { NextOpportunitySchema } from "./assistant.schema";
import * as service from "./assistant.service";

export async function nextOpportunity(req: Request, res: Response) {
  const { text, useSavedProfile } = NextOpportunitySchema.parse(req.body);
  res.json(await service.nextOpportunity(authUser(req).id, text, useSavedProfile));
}
