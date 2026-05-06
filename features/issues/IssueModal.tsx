"use client";

import { FormEvent, useMemo, useState } from "react";
import { Trash2, X } from "lucide-react";
import type { BoardItem, Priority, Status, User } from "@/types";

type FormState = {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  assignee: string;
};

type Props = {
  members: User[];
  item: BoardItem | null;
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

export function IssueModal({
  item,
  onClose,
  onSave,
  members,
  onDelete,
  onComment,
}: Props) {
  const initialValues = useMemo<FormState | null>(() => {
    if (!item) return null;

    return {
      title: item.title,
      description: item.description ?? "",
      status: item.status,
      priority: item.priority,
      dueDate:
        "isDefault" in item && item.isDefault === true
          ? ""
          : formatDate(item.dueDate),
      assignee:
        typeof item.assignee === "string"
          ? item.assignee
          : (item.assignee?.id ?? ""),
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

  async function submitComment(event: FormEvent) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              {isDefault ? "Default task" : "Issue"}
            </p>
            <h2 className="text-lg font-semibold text-slate-950">
              {values.title}
            </h2>
          </div>
          <button
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Title
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-600"
                value={values.title}
                onChange={(event) =>
                  setValues({ ...values, title: event.target.value })
                }
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                className="mt-1 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-600"
                value={values.description}
                onChange={(event) =>
                  setValues({ ...values, description: event.target.value })
                }
              />
            </label>

            {!isDefault && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Comments
                </h3>
                <form className="flex gap-2" onSubmit={submitComment}>
                  <input
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Add a comment"
                  />
                  <button
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                    type="submit"
                  >
                    Add
                  </button>
                </form>

                <div className="space-y-2">
                  {activeItem.comments?.map((entry) => (
                    <div
                      className="rounded-md border border-slate-200 p-3 text-sm"
                      key={entry._id}
                    >
                      <p className="font-semibold text-slate-800">
                        {entry.authorName}
                      </p>
                      <p className="mt-1 text-slate-700">{entry.body}</p>
                    </div>
                  ))}
                  {!activeItem.comments?.length && (
                    <p className="text-sm text-slate-500">No comments yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Status
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-600"
                value={values.status}
                onChange={(event) =>
                  setValues({ ...values, status: event.target.value as Status })
                }
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Priority
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-600"
                value={values.priority}
                onChange={(event) =>
                  setValues({
                    ...values,
                    priority: event.target.value as Priority,
                  })
                }
              >
                {priorities.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>

            {!isDefault && (
              <label className="block text-sm font-medium text-slate-700">
                Due date
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-600"
                  type="date"
                  value={values.dueDate}
                  onChange={(event) =>
                    setValues({ ...values, dueDate: event.target.value })
                  }
                />
              </label>
            )}

            {!isDefault && activeItem.activity?.length ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  Activity
                </h3>
                <div className="space-y-2">
                  {activeItem.activity
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <p
                        className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600"
                        key={entry._id}
                      >
                        <span className="font-semibold">{entry.actorName}</span>{" "}
                        {entry.action}
                      </p>
                    ))}
                </div>
              </div>
            ) : null}

            <div className="flex gap-2 pt-2">
              <button
                className="flex-1 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                disabled={busy}
                onClick={submitValues}
                type="button"
              >
                Save
              </button>
              <button
                className="rounded-md border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
                disabled={busy}
                onClick={() => onDelete(activeItem)}
                type="button"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
