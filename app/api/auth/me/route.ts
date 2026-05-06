import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/server/utils/apiResponse";
import { requireUser } from "@/server/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const user = requireUser(request);
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
