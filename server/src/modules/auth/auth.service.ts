import bcrypt from "bcryptjs";
import { User } from "../users/user.model";
import { signToken } from "../../middleware/auth";
import { HttpError } from "../../middleware/errorHandler";
import type { Role } from "../common/constants";
import type { z } from "zod";
import type { LoginSchema, RegisterSchema } from "./auth.schema";

const session = (user: { id: string; name: string; role: string; email: string }) => ({
  token: signToken({ id: user.id, role: user.role as Role }),
  user: { id: user.id, name: user.name, email: user.email, role: user.role },
});

export async function register(input: z.infer<typeof RegisterSchema>) {
  const { password, ...data } = input;
  if (await User.exists({ email: data.email })) throw new HttpError(409, "Email already registered");
  const user = await User.create({
    ...data,
    passwordHash: await bcrypt.hash(password, 10),
    // organisations don't need seeker defaults
    ...(data.role === "ORGANISATION" ? { availability: undefined, preferences: undefined } : {}),
  });
  return session(user);
}

export async function login(input: z.infer<typeof LoginSchema>) {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  return session(user);
}

export function logout() {
  return {
    ok: true,
    message: "Logged out successfully. Client credentials cleared.",
    stateless: true,
  };
}

