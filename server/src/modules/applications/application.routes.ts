import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as c from "./application.controller";

const router = Router();

router.post("/", requireAuth, requireRole("SEEKER"), c.apply);
router.get("/me", requireAuth, requireRole("SEEKER"), c.mine);
router.patch("/:id/status", requireAuth, requireRole("ORGANISATION"), c.setStatus);

export default router;
