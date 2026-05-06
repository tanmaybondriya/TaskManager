import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/server/config/db";
import { registerUser } from "@/server/services/authService";
import { handleApiError } from "@/server/utils/apiResponse";
import { setAuthCookies } from "@/server/utils/auth";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    await connectDb();
    const payload = await registerUser(registerSchema.parse(await request.json()));
    const response = NextResponse.json({ user: payload.user }, { status: 201 });
    setAuthCookies(response, payload.accessToken, payload.refreshToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
