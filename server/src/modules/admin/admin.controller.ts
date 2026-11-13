import type { Request, Response } from "express";
import * as service from "./admin.service";

export async function stats(_req: Request, res: Response) {
  res.json(await service.stats());
}
