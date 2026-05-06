"use client";

import { DndContext, DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays } from "lucide-react";
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
      className={`flex min-h-96 flex-col rounded-lg border border-slate-200 bg-slate-100 ${
        isOver ? "ring-2 ring-blue-500" : ""
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
  };

  const isDefault = "isDefault" in item && item.isDefault === true;

  return (
    <article
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300 ${
        isDragging ? "opacity-60" : ""
      }`}
      ref={setNodeRef}
      style={style}
    >
      <button className="w-full text-left" onClick={() => onOpen(item)} type="button">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold leading-5 text-slate-950">{item.title}</h3>
          {isDefault && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">Base</span>}
        </div>
        {item.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{item.description}</p>}
      </button>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={`rounded px-2 py-1 text-xs font-semibold ${
            item.priority === "High"
              ? "bg-red-50 text-red-700"
              : item.priority === "Medium"
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {item.priority}
        </span>
        {"dueDate" in item && item.dueDate && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays size={13} />
            {new Date(item.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <button
        className="mt-3 w-full cursor-grab rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-500 active:cursor-grabbing"
        type="button"
        {...listeners}
        {...attributes}
      >
        Drag
      </button>
    </article>
  );
}

export function KanbanBoard({ items, onMove, onOpen }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const targetStatus = event.over?.id as Status | undefined;
    const item = event.active.data.current?.item as BoardItem | undefined;

    if (!item || !targetStatus || !columns.includes(targetStatus) || item.status === targetStatus) {
      return;
    }

    onMove(item, targetStatus);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid min-w-[780px] grid-cols-3 gap-4 lg:min-w-0">
        {columns.map((status) => {
          const columnItems = items.filter((item) => item.status === status);

          return (
            <DroppableColumn key={status} status={status}>
              <header className="flex items-center justify-between border-b border-slate-200 px-3 py-3">
                <h2 className="text-sm font-semibold text-slate-800">{status}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">{columnItems.length}</span>
              </header>
              <div className="flex flex-1 flex-col gap-3 p-3">
                {columnItems.map((item) => (
                  <TaskCard item={item} key={itemId(item)} onOpen={onOpen} />
                ))}
                {!columnItems.length && (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
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
