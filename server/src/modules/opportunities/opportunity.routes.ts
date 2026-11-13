import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as c from "./opportunity.controller";
import { listForOpportunity } from "../applications/application.controller";

const router = Router();

// Browsing and details are public so shared links work for anyone.
router.get("/", c.list);
router.get("/mine", requireAuth, requireRole("ORGANISATION"), c.mine);
router.post("/", requireAuth, requireRole("ORGANISATION"), c.create);
router.get("/:id", c.getById);
router.patch("/:id", requireAuth, requireRole("ORGANISATION"), c.update);
router.get("/:id/applications", requireAuth, requireRole("ORGANISATION"), listForOpportunity);

export default router;
