"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { Filter, Plus, RotateCcw, Search, UserRound } from "lucide-react";
import { KanbanBoard } from "@/features/issues/KanbanBoard";
import { IssueModal } from "@/features/issues/IssueModal";
import { cloneDefaultTasks } from "@/features/issues/defaultTasks";
import { ProjectSidebar } from "@/features/projects/ProjectSidebar";
import { apiFetch } from "@/lib/api";
import type { BoardItem, DefaultTask, Issue, Priority, Project, Status, User } from "@/types";

type Filters = {
  status: "All" | Status;
  priority: "All" | Priority;
  assignee: string;
  personSearch: string;
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

function memberLabel(member: User, currentUserId?: string) {
  return member.id === currentUserId ? `${member.name} (me)` : member.name;
}

function priorityClasses(priority: Priority) {
  if (priority === "High") return "bg-red-100 text-red-700 ring-red-200";
  if (priority === "Medium") return "bg-amber-100 text-amber-800 ring-amber-200";
  return "bg-emerald-100 text-emerald-700 ring-emerald-200";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [defaultTasks, setDefaultTasks] = useState<DefaultTask[]>(() => cloneDefaultTasks());
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: "All",
    priority: "All",
    assignee: "All",
    personSearch: "",
    search: "",
  });
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

        const userResponse = await apiFetch<{ users: User[] }>("/users");
        setTeamMembers(userResponse.users);
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
    if (filters.assignee !== "All" && filters.assignee !== "Unassigned") params.set("assignee", filters.assignee);
    if (filters.search.trim()) params.set("search", filters.search.trim());

    const response = await apiFetch<{ issues: Issue[] }>(`/projects/${projectId}/issues?${params.toString()}`);
    setIssues(response.issues);
  }, [activeProjectId, filters.assignee, filters.priority, filters.search, filters.status]);

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
      if (filters.assignee === "Unassigned" && item.assignee) return false;
      if (filters.assignee !== "All" && filters.assignee !== "Unassigned" && item.assignee !== filters.assignee) return false;
      if (search && !`${item.title} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [defaultTasks, issues, filters]);

  const orderedTeamMembers = useMemo(() => {
    if (!user) return teamMembers;
    return [...teamMembers].sort((first, second) => {
      if (first.id === user.id) return -1;
      if (second.id === user.id) return 1;
      return first.name.localeCompare(second.name);
    });
  }, [teamMembers, user]);

  const filteredTeamMembers = useMemo(() => {
    const search = filters.personSearch.trim().toLowerCase();
    if (!search) return orderedTeamMembers;

    const matches = orderedTeamMembers.filter((member) =>
      `${member.name} ${member.email}`.toLowerCase().includes(search),
    );

    const selected = orderedTeamMembers.find((member) => member.id === filters.assignee);
    if (selected && !matches.some((member) => member.id === selected.id)) {
      return [selected, ...matches];
    }

    return matches;
  }, [filters.assignee, filters.personSearch, orderedTeamMembers]);

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

  async function createIssue(event: SyntheticEvent<HTMLFormElement>) {
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
        assignee: form.get("assignee"),
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

  async function saveItem(
    item: BoardItem,
    values: { title: string; description: string; status: Status; priority: Priority; assignee: string; dueDate: string },
  ) {
    if (isDefaultTask(item)) {
      const assignee = orderedTeamMembers.find((member) => member.id === values.assignee);
      setDefaultTasks((current) =>
        current.map((task) =>
          task.id === item.id
            ? {
                ...task,
                title: values.title,
                description: values.description,
                status: values.status,
                priority: values.priority,
                assignee: assignee?.id,
                assigneeName: assignee?.name ?? "",
              }
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

  function applySearch(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    loadIssues().catch((err) => setError(err instanceof Error ? err.message : "Search failed"));
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-xs text-slate-600">Loading workspace...</main>;
  }

  const activeProject = projects.find((project) => project._id === activeProjectId);
  const doneCount = displayedItems.filter((item) => item.status === "Done").length;
  const assignedCount = displayedItems.filter((item) => item.assignee).length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950 md:flex">
      <ProjectSidebar
        activeProjectId={activeProjectId}
        onCreate={createProject}
        onLogout={logout}
        onSelect={setActiveProjectId}
        projects={projects}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-3 py-3 md:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">{activeProject?.key ?? "WORK"} board</p>
              <h1 className="truncate text-xl font-semibold text-slate-950 md:text-2xl">
                {activeProject?.name ?? "Workspace Project"}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">{displayedItems.length} visible issues across {projects.length} projects</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                <p className="text-[10px] font-semibold uppercase text-slate-500">Assigned</p>
                <p className="text-xs font-semibold text-slate-900">{assignedCount}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                <p className="text-[10px] font-semibold uppercase text-slate-500">Done</p>
                <p className="text-xs font-semibold text-slate-900">{doneCount}</p>
              </div>
              <button
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 sm:col-span-1"
                onClick={() => setCreateOpen(true)}
                type="button"
              >
                <Plus size={14} /> Create issue
              </button>
            </div>
          </div>
        </header>

        {error && <p className="mx-3 mt-3 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700 md:mx-5">{error}</p>}

        <div className="flex flex-1 flex-col gap-3 p-3 md:p-5">
          <section className="rounded-md border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="grid gap-2.5 xl:grid-cols-[minmax(170px,1fr)_140px_140px_minmax(200px,240px)_auto] xl:items-end">
              <form className="flex min-w-0 gap-1.5" onSubmit={applySearch}>
                <label className="min-w-0 flex-1 text-[11px] font-semibold uppercase text-slate-500">
                  Search issues
                  <div className="relative mt-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      className="h-9 w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                      placeholder="Title or description"
                      value={filters.search}
                      onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                    />
                  </div>
                </label>
                <button className="mt-5 h-9 rounded-md bg-slate-900 px-2.5 text-white hover:bg-slate-800" type="submit">
                  <Search size={14} />
                </button>
              </form>

              <label className="text-[11px] font-semibold uppercase text-slate-500">
                Status
                <select
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                  value={filters.status}
                  onChange={(event) => setFilters({ ...filters, status: event.target.value as Filters["status"] })}
                >
                  <option>All</option>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="text-[11px] font-semibold uppercase text-slate-500">
                Priority
                <select
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                  value={filters.priority}
                  onChange={(event) => setFilters({ ...filters, priority: event.target.value as Filters["priority"] })}
                >
                  <option>All</option>
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>

              <label className="text-[11px] font-semibold uppercase text-slate-500">
                Search people
                <div className="relative mt-1">
                  <UserRound className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    className="h-9 w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                    placeholder="Name or email"
                    value={filters.personSearch}
                    onChange={(event) => setFilters({ ...filters, personSearch: event.target.value })}
                  />
                </div>
              </label>

              <div className="flex gap-1.5">
                <label className="min-w-0 flex-1 text-[11px] font-semibold uppercase text-slate-500">
                  Assignee
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                    value={filters.assignee}
                    onChange={(event) => setFilters({ ...filters, assignee: event.target.value })}
                  >
                    <option value="All">All assignees</option>
                    <option value="Unassigned">Unassigned</option>
                    {filteredTeamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {memberLabel(member, user?.id)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="mt-5 flex h-9 items-center justify-center rounded-md border border-slate-300 px-2.5 text-slate-700 hover:bg-slate-50"
                  onClick={() => setFilters({ status: "All", priority: "All", assignee: "All", personSearch: "", search: "" })}
                  type="button"
                  title="Reset filters"
                >
                  <Filter size={14} />
                </button>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-slate-600">
              {activeProject?.key ?? "WORK"} has {issues.length} saved issues and {defaultTasks.length} starter tasks
            </p>
            <button
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => setDefaultTasks(cloneDefaultTasks())}
              type="button"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <div className="min-w-0 overflow-x-auto pb-2">
            <KanbanBoard items={displayedItems} onMove={moveItem} onOpen={setSelectedItem} />
          </div>
        </div>
      </section>

      {createOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-3">
          <form className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-4 shadow-xl" onSubmit={createIssue}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase text-blue-700">{activeProject?.key ?? "WORK"}</p>
                <h2 className="text-base font-semibold text-slate-950">Create issue</h2>
              </div>
              <button className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold" onClick={() => setCreateOpen(false)} type="button">
                Cancel
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                Title
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600" name="title" required />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Description
                <textarea
                  className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600"
                  name="description"
                />
              </label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700">
                  Status
                  <select className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600" defaultValue="To Do" name="status">
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-slate-700">
                  Priority
                  <select className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600" defaultValue="Medium" name="priority">
                    {priorities.map((priority) => (
                      <option className={priorityClasses(priority)} key={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700">
                  Assignee
                  <select className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600" defaultValue={user?.id ?? ""} name="assignee">
                    <option value="">Unassigned</option>
                    {orderedTeamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {memberLabel(member, user?.id)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-slate-700">
                  Due date
                  <input className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600" name="dueDate" type="date" />
                </label>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800" type="submit">
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      <IssueModal
        currentUserId={user?.id}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onComment={addComment}
        onDelete={deleteItem}
        onSave={saveItem}
        teamMembers={orderedTeamMembers}
        key={selectedItem ? itemId(selectedItem) : "empty"}
      />
    </main>
  );
}
