import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/server/config/db";
import { createProject, listProjects } from "@/server/services/projectService";
import { handleApiError } from "@/server/utils/apiResponse";
import { requireUser } from "@/server/utils/auth";

const createProjectSchema = z.object({
  name: z.string().min(2),
  key: z.string().min(2).max(8),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await connectDb();
    const user = requireUser(request);
    const projects = await listProjects(user.id);
    return NextResponse.json({ projects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDb();
    const user = requireUser(request);
    const project = await createProject(user.id, createProjectSchema.parse(await request.json()));
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
