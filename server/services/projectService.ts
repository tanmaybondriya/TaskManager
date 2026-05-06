import { Types } from "mongoose";
import { Project } from "@/server/models/Project";
import { HttpError } from "@/server/utils/httpError";

export async function ensureDefaultProject(ownerId: string) {
  const existing = await Project.findOne({ owner: ownerId }).sort({ createdAt: 1 });
  if (existing) {
    return existing;
  }

  return Project.create({
    name: "Workspace Project",
    key: "WORK",
    description: "Default project for your Jira-like dashboard.",
    owner: ownerId,
  });
}

export async function listProjects(ownerId: string) {
  await ensureDefaultProject(ownerId);
  return Project.find({ owner: ownerId }).sort({ createdAt: 1 });
}

export async function createProject(ownerId: string, input: { name: string; key: string; description?: string }) {
  return Project.create({
    ...input,
    key: input.key.toUpperCase(),
    owner: ownerId,
  });
}

export async function getProjectForUser(projectId: string, ownerId: string) {
  if (!Types.ObjectId.isValid(projectId)) {
    throw new HttpError(404, "Project not found");
  }

  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  return project;
}

export async function updateProject(
  projectId: string,
  ownerId: string,
  input: { name?: string; key?: string; description?: string },
) {
  await getProjectForUser(projectId, ownerId);

  return Project.findByIdAndUpdate(
    projectId,
    { ...input, key: input.key?.toUpperCase() },
    { new: true, runValidators: true },
  );
}

export async function deleteProject(projectId: string, ownerId: string) {
  const project = await getProjectForUser(projectId, ownerId);
  await project.deleteOne();
}
