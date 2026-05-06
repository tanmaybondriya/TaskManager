import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/server/config/db";
import { deleteProject, getProjectForUser, updateProject } from "@/server/services/projectService";
import { handleApiError } from "@/server/utils/apiResponse";
import { requireUser } from "@/server/utils/auth";

type Context = {
  params: Promise<{ projectId: string }>;
};

const updateProjectSchema = z
  .object({
    name: z.string().min(2),
    key: z.string().min(2).max(8),
    description: z.string(),
  })
  .partial();

export async function GET(request: NextRequest, context: Context) {
  try {
    await connectDb();
    const user = requireUser(request);
    const { projectId } = await context.params;
    const project = await getProjectForUser(projectId, user.id);
    return NextResponse.json({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    await connectDb();
    const user = requireUser(request);
    const { projectId } = await context.params;
    const project = await updateProject(projectId, user.id, updateProjectSchema.parse(await request.json()));
    return NextResponse.json({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    await connectDb();
    const user = requireUser(request);
    const { projectId } = await context.params;
    await deleteProject(projectId, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
