import type { Request, Response } from "express";
import { authUser } from "../../middleware/auth";
import { ApplySchema, IdParam, StatusSchema } from "./application.schema";
import * as service from "./application.service";

export async function apply(req: Request, res: Response) {
  const { opportunityId, message } = ApplySchema.parse(req.body);
  res.status(201).json(await service.apply(authUser(req).id, opportunityId, message));
}

export async function mine(req: Request, res: Response) {
  res.json(await service.mine(authUser(req).id));
}

export async function listForOpportunity(req: Request, res: Response) {
  const { id } = IdParam.parse(req.params);
  res.json(await service.forOpportunity(id, authUser(req).id));
}

export async function setStatus(req: Request, res: Response) {
  const { id } = IdParam.parse(req.params);
  const { status } = StatusSchema.parse(req.body);
  res.json(await service.setStatus(id, authUser(req).id, status));
}
