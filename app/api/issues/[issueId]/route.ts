import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/server/config/db";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/server/models/Issue";
import { deleteIssue, getIssueForUser, updateIssue } from "@/server/services/issueService";
import { handleApiError } from "@/server/utils/apiResponse";
import { requireUser } from "@/server/utils/auth";

type Context = {
  params: Promise<{ issueId: string }>;
};

const updateIssueSchema = z
  .object({
    title: z.string().min(2),
    description: z.string(),
    status: z.enum(ISSUE_STATUSES),
    priority: z.enum(ISSUE_PRIORITIES),
    assignee: z.string().or(z.literal("")),
    dueDate: z.string().or(z.literal("")),
  })
  .partial();

export async function GET(request: NextRequest, context: Context) {
  try {
    await connectDb();
    const user = requireUser(request);
    const { issueId } = await context.params;
    const issue = await getIssueForUser(issueId, user.id);
    return NextResponse.json({ issue });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    await connectDb();
    const user = requireUser(request);
    const { issueId } = await context.params;
    const issue = await updateIssue(issueId, { id: user.id, name: user.name }, updateIssueSchema.parse(await request.json()));
    return NextResponse.json({ issue });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    await connectDb();
    const user = requireUser(request);
    const { issueId } = await context.params;
    await deleteIssue(issueId, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
