import type { DefaultTask } from "@/types";

export const DEFAULT_TASKS: DefaultTask[] = [
  { id: "default-1", title: "Set up project workspace", status: "To Do", priority: "High", isDefault: true },
  { id: "default-2", title: "Design authentication flow", status: "To Do", priority: "Medium", isDefault: true },
  { id: "default-3", title: "Create Kanban board layout", status: "In Progress", priority: "High", isDefault: true },
  { id: "default-4", title: "Connect issue APIs", status: "In Progress", priority: "Medium", isDefault: true },
  { id: "default-5", title: "Polish responsive UI", status: "Done", priority: "Low", isDefault: true },
];

export function cloneDefaultTasks() {
  return DEFAULT_TASKS.map((task) => ({ ...task }));
}
