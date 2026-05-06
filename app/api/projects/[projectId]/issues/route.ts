import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/server/config/db";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/server/models/Issue";
import { createIssue, listIssues } from "@/server/services/issueService";
import { handleApiError } from "@/server/utils/apiResponse";
import { requireUser } from "@/server/utils/auth";

type Context = {
  params: Promise<{ projectId: string }>;
};

const issueSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(ISSUE_STATUSES).optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  assignee: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

export async function GET(request: NextRequest, context: Context) {
  try {
    await connectDb();
    const user = requireUser(request);
    const { projectId } = await context.params;
    const { searchParams } = request.nextUrl;
    const issues = await listIssues(projectId, user.id, {
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      assignee: searchParams.get("assignee") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    return NextResponse.json({ issues });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    await connectDb();
    const user = requireUser(request);
    const { projectId } = await context.params;
    const issue = await createIssue(projectId, { id: user.id, name: user.name }, issueSchema.parse(await request.json()));
    return NextResponse.json({ issue }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
