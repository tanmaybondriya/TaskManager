import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/config/db";
import { listUsers } from "@/server/services/userService";
import { handleApiError } from "@/server/utils/apiResponse";
import { requireUser } from "@/server/utils/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDb();
    requireUser(request);
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
