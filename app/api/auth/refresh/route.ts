import { NextRequest, NextResponse } from "next/server";
import { createAuthPayload } from "@/server/services/authService";
import { handleApiError } from "@/server/utils/apiResponse";
import { HttpError } from "@/server/utils/httpError";
import { setAuthCookies } from "@/server/utils/auth";
import { verifyRefreshToken } from "@/server/utils/tokens";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("refreshToken")?.value;
    if (!token) {
      throw new HttpError(401, "Refresh token required");
    }

    const user = verifyRefreshToken(token);
    if (user.tokenType !== "refresh") {
      throw new HttpError(401, "Invalid refresh token");
    }

    const payload = createAuthPayload({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({ user: payload.user });
    setAuthCookies(response, payload.accessToken, payload.refreshToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
