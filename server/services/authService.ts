import bcrypt from "bcryptjs";
import { User } from "@/server/models/User";
import { HttpError } from "@/server/utils/httpError";
import { signAccessToken, signRefreshToken, type TokenUser } from "@/server/utils/tokens";
import { ensureDefaultProject } from "./projectService";

function toTokenUser(user: { _id: unknown; email: string; name: string }): TokenUser {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
  };
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new HttpError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
  });

  await ensureDefaultProject(String(user._id));
  return createAuthPayload(toTokenUser(user));
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw new HttpError(401, "Invalid email or password");
  }

  await ensureDefaultProject(String(user._id));
  return createAuthPayload(toTokenUser(user));
}

export function createAuthPayload(user: TokenUser) {
  return {
    user,
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}
