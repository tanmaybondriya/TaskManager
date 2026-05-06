import jwt from "jsonwebtoken";
import { env } from "@/server/config/env";

export type TokenUser = {
  id: string;
  email: string;
  name: string;
};

export function signAccessToken(user: TokenUser) {
  return jwt.sign(user, env.accessSecret, { expiresIn: "15m" });
}

export function signRefreshToken(user: TokenUser) {
  return jwt.sign({ ...user, tokenType: "refresh" }, env.refreshSecret, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.accessSecret) as TokenUser;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.refreshSecret) as TokenUser & { tokenType: string };
}
