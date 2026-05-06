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
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="border-b border-slate-200 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">TaskBoard</p>
        <h1 className="mt-0.5 text-lg font-semibold text-slate-950">Projects</h1>
      </div>

      <div className="p-2.5">
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
          onClick={onCreate}
          type="button"
        >
          <Plus size={14} /> Project
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-2.5 pb-2.5 md:flex-col md:overflow-y-auto md:pb-3">
        {projects.map((project) => (
          <button
            className={`flex min-w-44 items-center gap-1.5 rounded-md px-2.5 py-2 text-left text-xs ${
              activeProjectId === project._id
                ? "bg-blue-50 font-semibold text-blue-800 ring-1 ring-blue-100"
                : "text-slate-700 hover:bg-slate-100"
            }`}
            key={project._id}
            onClick={() => onSelect(project._id)}
            type="button"
          >
            <FolderKanban size={14} />
            <span className="truncate">{project.name}</span>
          </button>
        ))}
      </div>

      <button
        className="mx-2.5 mb-2.5 mt-1 flex items-center justify-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 md:mt-auto"
        onClick={onLogout}
        type="button"
      >
        <LogOut size={14} /> Logout
      </button>
    </aside>
  );
}
