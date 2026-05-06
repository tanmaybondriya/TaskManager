"use client";

import { useMemo, useState } from "react";
import type { SyntheticEvent } from "react";
import { Trash2, UserRound, X } from "lucide-react";
import type { BoardItem, Priority, Status, User } from "@/types";

type FormState = {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string;
  dueDate: string;
};

type Props = {
  item: BoardItem | null;
  currentUserId?: string;
  teamMembers: User[];
  onClose: () => void;
  onSave: (item: BoardItem, values: FormState) => Promise<void> | void;
  onDelete: (item: BoardItem) => Promise<void> | void;
  onComment: (issueId: string, body: string) => Promise<void>;
};

const statuses: Status[] = ["To Do", "In Progress", "Done"];
const priorities: Priority[] = ["Low", "Medium", "High"];

function itemId(item: BoardItem) {
  return "isDefault" in item && item.isDefault === true ? item.id : item._id;
}

function formatDate(date?: string) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function displayName(member: User, currentUserId?: string) {
  return member.id === currentUserId ? `${member.name} (me)` : member.name;
}

export function IssueModal({ item, currentUserId, teamMembers, onClose, onSave, onDelete, onComment }: Props) {
  const initialValues = useMemo<FormState | null>(() => {
    if (!item) return null;

    return {
      title: item.title,
      description: item.description ?? "",
      status: item.status,
      priority: item.priority,
      assignee: item.assignee ?? "",
      dueDate: "isDefault" in item && item.isDefault === true ? "" : formatDate(item.dueDate),
    };
  }, [item]);

  const [values, setValues] = useState<FormState | null>(initialValues);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!item || !values) return null;

  const activeItem = item;
  const activeValues = values;
  const isDefault = "isDefault" in activeItem && activeItem.isDefault === true;

  async function submitValues() {
    setBusy(true);
    try {
      await onSave(activeItem, activeValues);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDefault || !comment.trim()) return;

    setBusy(true);
    try {
    await onComment(itemId(activeItem), comment.trim());
      setComment("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500">{isDefault ? "Default task" : "Issue"}</p>
            <h2 className="text-base font-semibold text-slate-950">{values.title}</h2>
          </div>
          <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_210px]">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Title
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600"
                value={values.title}
                onChange={(event) => setValues({ ...values, title: event.target.value })}
                required
              />
            </label>

            <label className="block text-xs font-medium text-slate-700">
              Description
              <textarea
                className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600"
                value={values.description}
                onChange={(event) => setValues({ ...values, description: event.target.value })}
              />
            </label>

            {!isDefault && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-800">Comments</h3>
                <form className="flex gap-1.5" onSubmit={submitComment}>
                  <input
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Add a comment"
                  />
                  <button className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white" type="submit">
                    Add
                  </button>
                </form>

                <div className="space-y-1.5">
                  {activeItem.comments?.map((entry) => (
                    <div className="rounded-md border border-slate-200 p-2.5 text-xs" key={entry._id}>
                      <p className="font-semibold text-slate-800">{entry.authorName}</p>
                      <p className="mt-1 text-slate-700">{entry.body}</p>
                    </div>
                  ))}
                  {!activeItem.comments?.length && <p className="text-xs text-slate-500">No comments yet.</p>}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Assignee
              <div className="relative mt-1">
                <UserRound className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select
                  className="w-full rounded-md border border-slate-300 py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-blue-600"
                  value={values.assignee}
                  onChange={(event) => setValues({ ...values, assignee: event.target.value })}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {displayName(member, currentUserId)}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="block text-xs font-medium text-slate-700">
              Status
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600"
                value={values.status}
                onChange={(event) => setValues({ ...values, status: event.target.value as Status })}
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-slate-700">
              Priority
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600"
                value={values.priority}
                onChange={(event) => setValues({ ...values, priority: event.target.value as Priority })}
              >
                {priorities.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>

            {!isDefault && (
              <label className="block text-xs font-medium text-slate-700">
                Due date
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-600"
                  type="date"
                  value={values.dueDate}
                  onChange={(event) => setValues({ ...values, dueDate: event.target.value })}
                />
              </label>
            )}

            {!isDefault && activeItem.activity?.length ? (
              <div>
                <h3 className="mb-1.5 text-xs font-semibold text-slate-800">Activity</h3>
                <div className="space-y-1.5">
                  {activeItem.activity.slice().reverse().map((entry) => (
                    <p className="rounded-md bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600" key={entry._id}>
                      <span className="font-semibold">{entry.actorName}</span> {entry.action}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex gap-1.5 pt-1">
              <button
                className="flex-1 rounded-md bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                disabled={busy}
                onClick={submitValues}
                type="button"
              >
                Save
              </button>
              <button
                className="rounded-md border border-red-200 px-2.5 py-1.5 text-red-700 hover:bg-red-50"
                disabled={busy}
                onClick={() => onDelete(activeItem)}
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
