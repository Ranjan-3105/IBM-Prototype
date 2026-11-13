import type { Request, Response } from "express";
import { authUser } from "../../middleware/auth";
import {
  ExtractSkillsSchema,
  UpdateSeekerProfileSchema,
  UpdateOrgProfileSchema,
} from "./user.schema";
import * as service from "./user.service";
import { z } from "zod";

// ─── Seeker profile ──────────────────────────────────────────────────────────

export async function getMe(req: Request, res: Response) {
  res.json(await service.getMe(authUser(req).id));
}

export async function updateMe(req: Request, res: Response) {
  res.json(await service.updateSeekerProfile(authUser(req).id, UpdateSeekerProfileSchema.parse(req.body)));
}

// ─── Organisation profile ────────────────────────────────────────────────────

export async function getOrgMe(req: Request, res: Response) {
  res.json(await service.getMe(authUser(req).id));
}

export async function updateOrgMe(req: Request, res: Response) {
  res.json(await service.updateOrgProfile(authUser(req).id, UpdateOrgProfileSchema.parse(req.body)));
}

// ─── Seeker skill management ─────────────────────────────────────────────────

const AddSkillSchema = z.object({
  skill: z.string().trim().min(1),
  level: z.number().int().min(1).max(5),
  source: z.enum(["SELF", "AI_EXTRACTED"]).optional(),
});

const EditSkillSchema = z.object({
  level: z.number().int().min(1).max(5).optional(),
  source: z.enum(["SELF", "AI_EXTRACTED"]).optional(),
}).strict();

export async function addSkill(req: Request, res: Response) {
  const payload = AddSkillSchema.parse(req.body);
  const result = await service.addSkill(authUser(req).id, payload);
  res.status(201).json(result);
}

export async function editSkill(req: Request, res: Response) {
  const payload = EditSkillSchema.parse(req.body);
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  res.json(await service.editSkill(authUser(req).id, slug, payload));
}

export async function removeSkill(req: Request, res: Response) {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  await service.removeSkill(authUser(req).id, slug);
  res.status(204).send();
}

// ─── AI skill extraction ─────────────────────────────────────────────────────

export async function extractSkills(req: Request, res: Response) {
  const { text } = ExtractSkillsSchema.parse(req.body);
  res.json(await service.extractSkills(text));
}
