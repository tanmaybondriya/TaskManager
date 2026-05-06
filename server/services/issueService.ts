import { Types } from "mongoose";
import { Issue, ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/server/models/Issue";
import { HttpError } from "@/server/utils/httpError";
import { getProjectForUser } from "./projectService";

type Actor = {
  id: string;
  name: string;
};

type IssueInput = {
  title: string;
  description?: string;
  status?: (typeof ISSUE_STATUSES)[number];
  priority?: (typeof ISSUE_PRIORITIES)[number];
  assignee?: string;
  dueDate?: string;
};

function activity(actor: Actor, action: string, field?: string, from?: string, to?: string) {
  return {
    actor: actor.id,
    actorName: actor.name,
    action,
    field,
    from,
    to,
  };
}

export async function listIssues(
  projectId: string,
  userId: string,
  filters: { status?: string; priority?: string; assignee?: string; search?: string },
) {
  await getProjectForUser(projectId, userId);

  const query: Record<string, unknown> = { project: projectId };
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.assignee) query.assignee = filters.assignee;
  if (filters.search) query.$text = { $search: filters.search };

  return Issue.find(query).sort({ updatedAt: -1 });
}

export async function createIssue(projectId: string, actor: Actor, input: IssueInput) {
  await getProjectForUser(projectId, actor.id);

  return Issue.create({
    ...input,
    project: projectId,
    reporter: actor.id,
    reporterName: actor.name,
    assignee: input.assignee || undefined,
    assigneeName: input.assignee ? actor.name : "",
    dueDate: input.dueDate || undefined,
    activity: [activity(actor, "created issue")],
  });
}

export async function getIssueForUser(issueId: string, userId: string) {
  if (!Types.ObjectId.isValid(issueId)) {
    throw new HttpError(404, "Issue not found");
  }

  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new HttpError(404, "Issue not found");
  }

  await getProjectForUser(String(issue.project), userId);
  return issue;
}

export async function updateIssue(issueId: string, actor: Actor, input: Partial<IssueInput>) {
  const issue = await getIssueForUser(issueId, actor.id);

  const trackedFields = ["title", "description", "status", "priority", "assignee", "dueDate"] as const;
  for (const field of trackedFields) {
    if (input[field] !== undefined) {
      const oldValue = issue[field] ? String(issue[field]) : "";
      const newValue = input[field] ? String(input[field]) : "";
      if (oldValue !== newValue) {
        issue.activity.push(activity(actor, `updated ${field}`, field, oldValue, newValue));
      }
    }
  }

  if (input.title !== undefined) issue.title = input.title;
  if (input.description !== undefined) issue.description = input.description;
  if (input.status !== undefined) issue.status = input.status;
  if (input.priority !== undefined) issue.priority = input.priority;
  if (input.assignee !== undefined) {
    issue.assignee = input.assignee ? new Types.ObjectId(input.assignee) : undefined;
    issue.assigneeName = input.assignee ? actor.name : "";
  }
  if (input.dueDate !== undefined) {
    issue.dueDate = input.dueDate ? new Date(input.dueDate) : undefined;
  }

  await issue.save();
  return issue;
}

export async function deleteIssue(issueId: string, userId: string) {
  const issue = await getIssueForUser(issueId, userId);
  await issue.deleteOne();
}

export async function addComment(issueId: string, actor: Actor, body: string) {
  const issue = await getIssueForUser(issueId, actor.id);

  issue.comments.push({
    body,
    author: new Types.ObjectId(actor.id),
    authorName: actor.name,
  });
  issue.activity.push(activity(actor, "added comment"));

  await issue.save();
  return issue;
}
