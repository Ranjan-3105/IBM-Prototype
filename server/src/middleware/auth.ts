import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "../modules/common/constants";

export type { Role };
export interface AuthUser {
  id: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorised" });
    return;
  }

  const token = header.slice(7).trim();
  if (!token) {
    res.status(401).json({ message: "Unauthorised" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & Partial<AuthUser>;
    if (!payload.id || !payload.role) {
      res.status(401).json({ message: "Invalid token payload" });
      return;
    }
    req.user = { id: payload.id, role: payload.role as Role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token has expired" });
      return;
    }
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };

/** Signs a short-lived stateless JWT access token. */
export function signToken(u: AuthUser, options?: { expiresIn?: string | number }): string {
  const expiresIn = options?.expiresIn ?? env.JWT_EXPIRES_IN;
  const signOptions: jwt.SignOptions = { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign({ id: u.id, role: u.role }, env.JWT_SECRET, signOptions);
}



/** Current user from a request that already passed requireAuth. */
export function authUser(req: Request): AuthUser {
  if (!req.user) throw new Error("requireAuth missing on route");
  return req.user;
}
