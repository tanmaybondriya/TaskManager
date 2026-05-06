"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Search } from "lucide-react";
import { KanbanBoard } from "@/features/issues/KanbanBoard";
import { IssueModal } from "@/features/issues/IssueModal";
import { cloneDefaultTasks } from "@/features/issues/defaultTasks";
import { ProjectSidebar } from "@/features/projects/ProjectSidebar";
import { apiFetch } from "@/lib/api";
import type { BoardItem, DefaultTask, Issue, Priority, Project, Status, User } from "@/types";

type Filters = {
  status: "All" | Status;
  priority: "All" | Priority;
  assignee: "All" | "Mine";
  search: string;
};

const statuses: Status[] = ["To Do", "In Progress", "Done"];
const priorities: Priority[] = ["Low", "Medium", "High"];

function isDefaultTask(item: BoardItem): item is DefaultTask {
  return "isDefault" in item && item.isDefault === true;
}

function itemId(item: BoardItem) {
  return isDefaultTask(item) ? item.id : item._id;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [defaultTasks, setDefaultTasks] = useState<DefaultTask[]>(() => cloneDefaultTasks());
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null);
  const [filters, setFilters] = useState<Filters>({ status: "All", priority: "All", assignee: "All", search: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const me = await apiFetch<{ user: User }>("/auth/me");
        setUser(me.user);

        const projectResponse = await apiFetch<{ projects: Project[] }>("/projects");
        setProjects(projectResponse.projects);
        setActiveProjectId(projectResponse.projects[0]?._id ?? "");
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [router]);

  const loadIssues = useCallback(async (projectId = activeProjectId) => {
    if (!projectId) return;

    const params = new URLSearchParams();
    if (filters.status !== "All") params.set("status", filters.status);
    if (filters.priority !== "All") params.set("priority", filters.priority);
    if (filters.assignee === "Mine" && user) params.set("assignee", user.id);
    if (filters.search.trim()) params.set("search", filters.search.trim());

    const response = await apiFetch<{ issues: Issue[] }>(`/projects/${projectId}/issues?${params.toString()}`);
    setIssues(response.issues);
  }, [activeProjectId, filters.assignee, filters.priority, filters.search, filters.status, user]);

  useEffect(() => {
    if (activeProjectId) {
      loadIssues(activeProjectId).catch((err) => setError(err instanceof Error ? err.message : "Failed to load issues"));
    }
  }, [activeProjectId, filters.status, filters.priority, filters.assignee, loadIssues]);

  const displayedItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const merged: BoardItem[] = [...defaultTasks, ...issues];

    return merged.filter((item) => {
      if (filters.status !== "All" && item.status !== filters.status) return false;
      if (filters.priority !== "All" && item.priority !== filters.priority) return false;
      if (filters.assignee === "Mine" && (isDefaultTask(item) || item.assignee !== user?.id)) return false;
      if (search && !`${item.title} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [defaultTasks, issues, filters, user]);

  async function logout() {
    await apiFetch<void>("/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
  }

  async function createProject() {
    const name = window.prompt("Project name");
    if (!name) return;

    const key = name
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 4)
      .toUpperCase() || "PROJ";

    const response = await apiFetch<{ project: Project }>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, key, description: "" }),
    });
    setProjects((current) => [...current, response.project]);
    setActiveProjectId(response.project._id);
  }

  async function createIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeProjectId || !user) return;

    const form = new FormData(event.currentTarget);
    const response = await apiFetch<{ issue: Issue }>(`/projects/${activeProjectId}/issues`, {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        status: form.get("status"),
        priority: form.get("priority"),
        assignee: form.get("assignToMe") ? user.id : "",
        dueDate: form.get("dueDate"),
      }),
    });

    setIssues((current) => [response.issue, ...current]);
    setCreateOpen(false);
    event.currentTarget.reset();
  }

  async function moveItem(item: BoardItem, status: Status) {
    if (isDefaultTask(item)) {
      setDefaultTasks((current) => current.map((task) => (task.id === item.id ? { ...task, status } : task)));
      return;
    }

    setIssues((current) => current.map((issue) => (issue._id === item._id ? { ...issue, status } : issue)));
    const response = await apiFetch<{ issue: Issue }>(`/issues/${item._id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setIssues((current) => current.map((issue) => (issue._id === item._id ? response.issue : issue)));
  }

  async function saveItem(item: BoardItem, values: { title: string; description: string; status: Status; priority: Priority; dueDate: string }) {
    if (isDefaultTask(item)) {
      setDefaultTasks((current) =>
        current.map((task) =>
          task.id === item.id
            ? { ...task, title: values.title, description: values.description, status: values.status, priority: values.priority }
            : task,
        ),
      );
      return;
    }

    const response = await apiFetch<{ issue: Issue }>(`/issues/${item._id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    setIssues((current) => current.map((issue) => (issue._id === item._id ? response.issue : issue)));
    setSelectedItem(response.issue);
  }

  async function deleteItem(item: BoardItem) {
    if (isDefaultTask(item)) {
      setDefaultTasks((current) => current.filter((task) => task.id !== item.id));
      setSelectedItem(null);
      return;
    }

    await apiFetch<void>(`/issues/${item._id}`, { method: "DELETE" });
    setIssues((current) => current.filter((issue) => issue._id !== item._id));
    setSelectedItem(null);
  }

  async function addComment(issueId: string, body: string) {
    const response = await apiFetch<{ issue: Issue }>(`/issues/${issueId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    setIssues((current) => current.map((issue) => (issue._id === issueId ? response.issue : issue)));
    setSelectedItem(response.issue);
  }

  function applySearch(event: FormEvent) {
    event.preventDefault();
    loadIssues().catch((err) => setError(err instanceof Error ? err.message : "Search failed"));
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading workspace...</main>;
  }

  const activeProject = projects.find((project) => project._id === activeProjectId);

  return (
    <main className="min-h-screen md:flex">
      <ProjectSidebar
        activeProjectId={activeProjectId}
        onCreate={createProject}
        onLogout={logout}
        onSelect={setActiveProjectId}
        projects={projects}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">{activeProject?.key ?? "WORK"} board</p>
              <h1 className="text-2xl font-semibold text-slate-950">{activeProject?.name ?? "Workspace Project"}</h1>
            </div>
            <button
              className="flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              onClick={() => setCreateOpen(true)}
              type="button"
            >
              <Plus size={16} /> Create issue
            </button>
          </div>
        </header>

        {error && <p className="mx-4 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 md:mx-6">{error}</p>}

        <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px] md:p-6">
          <div className="overflow-x-auto pb-2">
            <KanbanBoard items={displayedItems} onMove={moveItem} onOpen={setSelectedItem} />
          </div>

          <aside className="space-y-4">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              onClick={() => setDefaultTasks(cloneDefaultTasks())}
              type="button"
            >
              <RotateCcw size={16} /> Reset default tasks
            </button>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Filters</h2>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Status
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={filters.status}
                    onChange={(event) => setFilters({ ...filters, status: event.target.value as Filters["status"] })}
                  >
                    <option>All</option>
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Priority
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={filters.priority}
                    onChange={(event) => setFilters({ ...filters, priority: event.target.value as Filters["priority"] })}
                  >
                    <option>All</option>
                    {priorities.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Assignee
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={filters.assignee}
                    onChange={(event) => setFilters({ ...filters, assignee: event.target.value as Filters["assignee"] })}
                  >
                    <option>All</option>
                    <option>Mine</option>
                  </select>
                </label>

                <form className="flex gap-2" onSubmit={applySearch}>
                  <input
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Search"
                    value={filters.search}
                    onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                  />
                  <button className="rounded-md bg-slate-900 px-3 text-white" type="submit">
                    <Search size={16} />
                  </button>
                </form>
              </div>
            </section>
          </aside>
        </div>
      </section>

      {createOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
          <form className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl" onSubmit={createIssue}>
            <h2 className="text-lg font-semibold text-slate-950">Create issue</h2>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="title" placeholder="Title" required />
              <textarea className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" name="description" placeholder="Description" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="rounded-md border border-slate-300 px-3 py-2" defaultValue="To Do" name="status">
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <select className="rounded-md border border-slate-300 px-3 py-2" defaultValue="Medium" name="priority">
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2" name="dueDate" type="date" />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input name="assignToMe" type="checkbox" /> Assign to me
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setCreateOpen(false)} type="button">
                Cancel
              </button>
              <button className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      <IssueModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onComment={addComment}
        onDelete={deleteItem}
        onSave={saveItem}
        key={selectedItem ? itemId(selectedItem) : "empty"}
      />
    </main>
  );
}
