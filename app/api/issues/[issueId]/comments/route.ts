import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/server/config/db";
import { addComment } from "@/server/services/issueService";
import { handleApiError } from "@/server/utils/apiResponse";
import { requireUser } from "@/server/utils/auth";

type Context = {
  params: Promise<{ issueId: string }>;
};

const commentSchema = z.object({
  body: z.string().min(1),
});

export async function POST(request: NextRequest, context: Context) {
  try {
    await connectDb();
    const user = requireUser(request);
    const { issueId } = await context.params;
    const issue = await addComment(issueId, { id: user.id, name: user.name }, commentSchema.parse(await request.json()).body);
    return NextResponse.json({ issue }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
