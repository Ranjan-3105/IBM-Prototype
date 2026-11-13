import { z } from "zod";
import { ORG_TYPES } from "../common/constants";

export const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    role: z.enum(["SEEKER", "ORGANISATION"]),
    orgType: z.enum(ORG_TYPES).optional(),
  })
  .refine((d) => d.role !== "ORGANISATION" || !!d.orgType, {
    message: "orgType is required for organisations",
    path: ["orgType"],
  });

export const LoginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

