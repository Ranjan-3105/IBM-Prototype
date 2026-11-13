import type { Request, Response } from "express";
import { LoginSchema, RegisterSchema } from "./auth.schema";
import * as service from "./auth.service";
import { authUser } from "../../middleware/auth";
import { User } from "../users/user.model";
import { HttpError } from "../../middleware/errorHandler";

export async function register(req: Request, res: Response) {
  res.status(201).json(await service.register(RegisterSchema.parse(req.body)));
}

export async function login(req: Request, res: Response) {
  res.json(await service.login(LoginSchema.parse(req.body)));
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(authUser(req).id);
  if (!user) throw new HttpError(404, "User not found");
  res.json(user);
}

export function logout(_req: Request, res: Response) {
  res.json(service.logout());
}

