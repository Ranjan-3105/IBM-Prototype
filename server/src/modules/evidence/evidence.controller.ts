import type { Request, Response } from "express";
import { authUser } from "../../middleware/auth";
import { CreateEvidenceSchema, IdParam } from "./evidence.schema";
import * as service from "./evidence.service";

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.create(authUser(req).id, CreateEvidenceSchema.parse(req.body)));
}

export async function mine(req: Request, res: Response) {
  res.json(await service.mine(authUser(req).id));
}

export async function remove(req: Request, res: Response) {
  await service.remove(authUser(req).id, IdParam.parse(req.params).id);
  res.status(204).end();
}

export async function endorse(req: Request, res: Response) {
  res.json(await service.endorse(authUser(req).id, IdParam.parse(req.params).id));
}
