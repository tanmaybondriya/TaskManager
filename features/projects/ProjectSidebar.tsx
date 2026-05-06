"use client";

import { FolderKanban, LogOut, Plus } from "lucide-react";
import type { Project } from "@/types";

type Props = {
  projects: Project[];
  activeProjectId?: string;
  onSelect: (projectId: string) => void;
  onCreate: () => void;
  onLogout: () => void;
};

export function ProjectSidebar({ projects, activeProjectId, onSelect, onCreate, onLogout }: Props) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white p-4 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase text-blue-700">TaskBoard</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-950">Projects</h1>
      </div>

      <button
        className="mb-3 flex items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        onClick={onCreate}
        type="button"
      >
        <Plus size={16} /> Project
      </button>

      <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {projects.map((project) => (
          <button
            className={`flex min-w-44 items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
              activeProjectId === project._id
                ? "bg-blue-50 font-semibold text-blue-800"
                : "text-slate-700 hover:bg-slate-100"
            }`}
            key={project._id}
            onClick={() => onSelect(project._id)}
            type="button"
          >
            <FolderKanban size={16} />
            <span className="truncate">{project.name}</span>
          </button>
        ))}
      </div>

      <button
        className="mt-4 flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:mt-auto"
        onClick={onLogout}
        type="button"
      >
        <LogOut size={16} /> Logout
      </button>
    </aside>
  );
}
