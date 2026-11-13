import { z } from "zod";
import { APP_STATUS } from "../common/constants";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const ApplySchema = z.object({ opportunityId: objectId, message: z.string().trim().max(1000).default("") });
export const StatusSchema = z.object({ status: z.enum(APP_STATUS).exclude(["APPLIED"]) });
export const IdParam = z.object({ id: objectId });
