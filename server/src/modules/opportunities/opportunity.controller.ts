import type { Request, Response } from "express";
import { z } from "zod";
import { authUser } from "../../middleware/auth";
import { CreateOpportunitySchema, ListOpportunitiesQuery, UpdateOpportunitySchema } from "./opportunity.schema";
import * as service from "./opportunity.service";

const IdParam = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id") });

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.create(authUser(req).id, CreateOpportunitySchema.parse(req.body)));
}

export async function list(req: Request, res: Response) {
  res.json(await service.list(ListOpportunitiesQuery.parse(req.query)));
}

export async function mine(req: Request, res: Response) {
  res.json(await service.mine(authUser(req).id));
}

export async function getById(req: Request, res: Response) {
  res.json(await service.getById(IdParam.parse(req.params).id));
}

export async function update(req: Request, res: Response) {
  const { id } = IdParam.parse(req.params);
  res.json(await service.update(id, authUser(req).id, UpdateOpportunitySchema.parse(req.body)));
}
