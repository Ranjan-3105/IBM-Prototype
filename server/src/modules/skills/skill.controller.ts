import type { Request, Response } from "express";
import { CreateSkillSchema, SkillQuerySchema } from "./skill.schema";
import * as service from "./skill.service";

export async function list(req: Request, res: Response) {
  const { q } = SkillQuerySchema.parse(req.query);
  res.json(await service.search(q));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.create(CreateSkillSchema.parse(req.body)));
}
