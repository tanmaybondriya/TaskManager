"use client";

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical, UserRound } from "lucide-react";
import type { BoardItem, Status } from "@/types";

const columns: Status[] = ["To Do", "In Progress", "Done"];

type Props = {
  items: BoardItem[];
  onMove: (item: BoardItem, status: Status) => void;
  onOpen: (item: BoardItem) => void;
};

function itemId(item: BoardItem) {
  return "isDefault" in item && item.isDefault === true ? item.id : item._id;
}

function DroppableColumn({ status, children }: { status: Status; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      className={`flex min-h-[24rem] flex-col rounded-md border border-slate-200 bg-slate-50 ${
        isOver ? "bg-blue-50 ring-2 ring-blue-500" : ""
      }`}
      ref={setNodeRef}
    >
      {children}
    </section>
  );
}

function TaskCard({ item, onOpen }: { item: BoardItem; onOpen: (item: BoardItem) => void }) {
  const id = itemId(item);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    touchAction: "none",
  };

  const isDefault = "isDefault" in item && item.isDefault === true;

  return (
    <article
      className={`cursor-grab rounded-md border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-blue-300 hover:shadow-md active:cursor-grabbing ${
        isDragging ? "opacity-60 ring-2 ring-blue-500" : ""
      }`}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <button className="w-full text-left" onClick={() => onOpen(item)} type="button">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-semibold leading-5 text-slate-950">{item.title}</h3>
          {isDefault && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">Base</span>}
        </div>
        {item.description && <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-slate-600">{item.description}</p>}
      </button>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
            item.priority === "High"
              ? "bg-red-50 text-red-700 ring-red-100"
              : item.priority === "Medium"
                ? "bg-amber-50 text-amber-700 ring-amber-100"
                : "bg-emerald-50 text-emerald-700 ring-emerald-100"
          }`}
        >
          {item.priority}
        </span>
        {"dueDate" in item && item.dueDate && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <CalendarDays size={12} />
            {new Date(item.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-600">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <UserRound size={12} />
          </span>
          <span className="truncate">{item.assigneeName || "Unassigned"}</span>
        </span>
        <span className="rounded-md p-1 text-slate-400" title="Drag issue">
          <GripVertical size={15} />
        </span>
      </div>
    </article>
  );
}

export function KanbanBoard({ items, onMove, onOpen }: Props) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const targetStatus = event.over?.id as Status | undefined;
    const item = event.active.data.current?.item as BoardItem | undefined;

    if (!item || !targetStatus || !columns.includes(targetStatus) || item.status === targetStatus) {
      return;
    }

    onMove(item, targetStatus);
  }

  return (
    <DndContext collisionDetection={closestCorners} sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-3 md:min-w-[760px] md:grid-cols-3 xl:min-w-0">
        {columns.map((status) => {
          const columnItems = items.filter((item) => item.status === status);

          return (
            <DroppableColumn key={status} status={status}>
              <header className="flex items-center justify-between border-b border-slate-200 px-2.5 py-2.5">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">{status}</h2>
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{columnItems.length}</span>
              </header>
              <div className="flex flex-1 flex-col gap-2.5 p-2.5">
                {columnItems.map((item) => (
                  <TaskCard item={item} key={itemId(item)} onOpen={onOpen} />
                ))}
                {!columnItems.length && (
                  <div className="rounded-md border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">
                    No issues
                  </div>
                )}
              </div>
            </DroppableColumn>
          );
        })}
      </div>
    </DndContext>
  );
}
