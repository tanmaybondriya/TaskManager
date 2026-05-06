import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/server/config/db";
import { loginUser } from "@/server/services/authService";
import { handleApiError } from "@/server/utils/apiResponse";
import { setAuthCookies } from "@/server/utils/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await connectDb();
    const payload = await loginUser(loginSchema.parse(await request.json()));
    const response = NextResponse.json({ user: payload.user });
    setAuthCookies(response, payload.accessToken, payload.refreshToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
