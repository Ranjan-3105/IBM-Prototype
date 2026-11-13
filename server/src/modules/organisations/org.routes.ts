import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as c from "../users/user.controller";

const router = Router();

/** GET  /api/organisations/me — returns current org user's profile */
router.get("/me", requireAuth, requireRole("ORGANISATION"), c.getOrgMe);

/** PATCH /api/organisations/me — updates org profile; `verified` is excluded */
router.patch("/me", requireAuth, requireRole("ORGANISATION"), c.updateOrgMe);

export default router;

