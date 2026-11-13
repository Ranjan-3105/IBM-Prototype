import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { env } from "../config/env";

/** Throw this from services/controllers to return a specific HTTP status. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues?: unknown[]
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Consistent 404 handler for all unmatched endpoints. */
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ message: "Validation failed", issues: err.issues });
    return;
  }

  if (err instanceof HttpError) {
    const payload: { message: string; issues?: unknown[] } = { message: err.message };
    if (err.issues && err.issues.length > 0) payload.issues = err.issues;
    res.status(err.status).json(payload);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid ${err.path}` });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: err.message });
    return;
  }

  // MongoDB duplicate key error (code 11000)
  if (typeof err === "object" && err && "code" in err && (err as { code: unknown }).code === 11000) {
    res.status(409).json({ message: "Duplicate entry" });
    return;
  }

  // Malformed JSON request body
  if (
    (err instanceof SyntaxError && "body" in err) ||
    (typeof err === "object" && err && "type" in err && (err as { type: unknown }).type === "entity.parse.failed")
  ) {
    res.status(400).json({ message: "Malformed JSON body" });
    return;
  }

  if (env.NODE_ENV !== "test") {
    console.error("Unhandled server error:", err);
  }

  res.status(500).json({ message: "Internal server error" });
}

