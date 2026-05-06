import { NextRequest, NextResponse } from "next/server";
import { isProduction } from "@/server/config/env";
import { HttpError } from "./httpError";
import { verifyAccessToken, type TokenUser } from "./tokens";

export const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

export function requireUser(request: NextRequest): TokenUser {
  const token = request.cookies.get("accessToken")?.value;

  if (!token) {
    throw new HttpError(401, "Authentication required");
  }

  try {
    return verifyAccessToken(token);
  } catch {
    throw new HttpError(401, "Invalid or expired access token");
  }
}

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set("accessToken", accessToken, {
    ...authCookieOptions,
    maxAge: 15 * 60,
  });
  response.cookies.set("refreshToken", refreshToken, {
    ...authCookieOptions,
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("accessToken", "", {
    ...authCookieOptions,
    maxAge: 0,
  });
  response.cookies.set("refreshToken", "", {
    ...authCookieOptions,
    maxAge: 0,
  });
}
