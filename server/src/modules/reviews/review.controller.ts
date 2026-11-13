import type { Request, Response } from "express";
import { authUser } from "../../middleware/auth";
import { CreateReviewSchema } from "./review.schema";
import * as service from "./review.service";

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.create(authUser(req).id, CreateReviewSchema.parse(req.body)));
}

export async function aboutMe(req: Request, res: Response) {
  res.json(await service.aboutMe(authUser(req).id));
}
