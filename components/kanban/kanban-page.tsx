"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { LayoutGrid, Plus, Zap } from "lucide-react";
import { toast } from "sonner";
import { AutomationPanel } from "@/components/kanban/automation-panel";
import { BoardDialog } from "@/components/kanban/board-dialog";
import { BoardSidebar } from "@/components/kanban/board-sidebar";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { Button } from "@/components/retroui/Button";
import { Drawer } from "@/components/retroui/Drawer";
import {
  deleteColumn,
  listBoardData,
  listBoards,
  moveTaskWithReorder,
  reorderColumns,
  updateColumn,
} from "@/lib/kanban/actions";
import type { KanbanColor } from "@/lib/kanban/colors";
import type {
  BoardData,
  BoardRecord,
  ColumnRecord,
  TaskDialogDefaults,
  TaskRecord,
} from "@/lib/kanban/types";
import {
  parseColumnDropId,
  parseTaskDragId,
} from "@/lib/kanban/types";

function getColumnTasks(tasks: TaskRecord[], columnId: number): TaskRecord[] {
  return tasks
    .filter((t) => t.columnId === columnId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

function findColumnForTask(
  tasks: TaskRecord[],
  taskId: number,
): number | null {
  const task = tasks.find((t) => t.id === taskId);
  return task?.columnId ?? null;
}

function findContainerId(
  overId: string,
  tasks: TaskRecord[],
): number | null {
  const columnId = parseColumnDropId(overId);
  if (columnId !== null) return columnId;

  const taskId = parseTaskDragId(overId);
  if (taskId !== null) return findColumnForTask(tasks, taskId);

  return null;
}

export function KanbanPage() {
  const [boards, setBoards] = useState<BoardRecord[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<number | null>(null);
  const [columns, setColumns] = useState<ColumnRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [pulseRiskByTaskId, setPulseRiskByTaskId] = useState<
    Record<number, { atRisk: number; blocked: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [automationPanelOpen, setAutomationPanelOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<BoardRecord | null>(null);
  const [mobileBoardsOpen, setMobileBoardsOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDefaults, setTaskDefaults] = useState<TaskDialogDefaults | null>(
    null,
  );
  const [activeDragTask, setActiveDragTask] = useState<TaskRecord | null>(null);
  const tasksSnapshotRef = useRef<TaskRecord[]>([]);
  const tasksRef = useRef<TaskRecord[]>([]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? null;

  const loadBoardData = useCallback(async (boardId: number) => {
    const data = await listBoardData(boardId);
    setColumns(data.columns);
    setTasks(data.tasks);
    setPulseRiskByTaskId(data.pulseRiskByTaskId);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const boardList = await listBoards();
        if (cancelled) return;
        setBoards(boardList);
        if (boardList.length > 0) {
          const firstId = boardList[0].id;
          setActiveBoardId(firstId);
          await loadBoardData(firstId);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadBoardData]);

  async function selectBoard(boardId: number) {
    setActiveBoardId(boardId);
    setMobileBoardsOpen(false);
    await loadBoardData(boardId);
  }

  function showUndo(message: string, snapshot: TaskRecord[]) {
    toast(message, {
      action: {
        label: "Undo",
        onClick: () => setTasks(snapshot),
      },
    });
  }

  function upsertTask(saved: TaskRecord) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  }

  function removeTask(taskId: number) {
    const snapshot = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showUndo("Task deleted", snapshot);
  }

  function openCreateBoard() {
    setEditingBoard(null);
    setBoardDialogOpen(true);
  }

  function openEditBoard(board: BoardRecord) {
    setEditingBoard(board);
    setBoardDialogOpen(true);
  }

  function handleBoardSaved(result: BoardData | BoardRecord) {
    if ("columns" in result) {
      setBoards((prev) => [...prev, result.board]);
      setActiveBoardId(result.board.id);
      setColumns(result.columns);
      setTasks(result.tasks);
      return;
    }

    setBoards((prev) =>
      prev.map((b) => (b.id === result.id ? result : b)),
    );
  }

  async function handleBoardDeleted(boardId: number) {
    const nextBoards = boards.filter((b) => b.id !== boardId);
    setBoards(nextBoards);
    if (activeBoardId === boardId) {
      if (nextBoards.length > 0) {
        await selectBoard(nextBoards[0].id);
      } else {
        setActiveBoardId(null);
        setColumns([]);
        setTasks([]);
      }
    }
  }

  function openCreateTask(columnId: number) {
    setTaskDefaults({ columnId });
    setTaskDialogOpen(true);
  }

  function openEditTask(task: TaskRecord) {
    setTaskDefaults({ task });
    setTaskDialogOpen(true);
  }

  async function handleRenameColumn(columnId: number, name: string) {
    const saved = await updateColumn(columnId, { name });
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? saved : c)),
    );
  }

  async function handleChangeColumnColor(columnId: number, color: KanbanColor) {
    const saved = await updateColumn(columnId, { color });
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? saved : c)),
    );
  }

  async function handleMoveColumn(columnId: number, direction: "left" | "right") {
    const sorted = [...columns].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
    );
    const index = sorted.findIndex((c) => c.id === columnId);
    if (index === -1) return;
    const swapIndex = direction === "left" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const reordered = arrayMove(sorted, index, swapIndex);
    const updated = await reorderColumns(
      activeBoardId!,
      reordered.map((c) => c.id),
    );
    setColumns(updated);
  }

  async function handleDeleteColumn(columnId: number) {
    if (!confirm("Delete this column? Tasks will move to another column.")) return;
    await deleteColumn(columnId);
    if (activeBoardId) {
      await loadBoardData(activeBoardId);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = parseTaskDragId(String(event.active.id));
    if (taskId === null) return;
    const task = tasks.find((t) => t.id === taskId) ?? null;
    setActiveDragTask(task);
    tasksSnapshotRef.current = [...tasks];
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = parseTaskDragId(String(active.id));
    if (activeTaskId === null) return;

    const activeColumnId = findColumnForTask(tasks, activeTaskId);
    const overColumnId = findContainerId(String(over.id), tasks);
    if (activeColumnId === null || overColumnId === null) return;
    if (activeColumnId === overColumnId) return;

    setTasks((prev) => {
      const activeTask = prev.find((t) => t.id === activeTaskId);
      if (!activeTask) return prev;

      const withoutActive = prev.filter((t) => t.id !== activeTaskId);
      const targetTasks = getColumnTasks(withoutActive, overColumnId);

      let insertIndex = targetTasks.length;
      const overTaskId = parseTaskDragId(String(over.id));
      if (overTaskId !== null) {
        const overIndex = targetTasks.findIndex((t) => t.id === overTaskId);
        if (overIndex >= 0) insertIndex = overIndex;
      }

      const movedTask: TaskRecord = {
        ...activeTask,
        columnId: overColumnId,
        sortOrder: insertIndex,
      };

      const nextTarget = [...targetTasks];
      nextTarget.splice(insertIndex, 0, movedTask);

      const reindexedTarget = nextTarget.map((t, i) => ({
        ...t,
        sortOrder: i,
      }));

      const sourceTasks = getColumnTasks(withoutActive, activeColumnId).map(
        (t, i) => ({ ...t, sortOrder: i }),
      );

      const otherTasks = withoutActive.filter(
        (t) => t.columnId !== activeColumnId && t.columnId !== overColumnId,
      );

      return [...otherTasks, ...sourceTasks, ...reindexedTarget];
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = parseTaskDragId(String(active.id));
    if (activeTaskId === null) return;

    const currentTasks = tasksRef.current;
    const activeColumnId = findColumnForTask(currentTasks, activeTaskId);
    const overColumnId = findContainerId(String(over.id), currentTasks);
    if (activeColumnId === null || overColumnId === null) return;

    let nextTasks = [...currentTasks];

    if (activeColumnId === overColumnId) {
      const columnTasks = getColumnTasks(nextTasks, activeColumnId);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeTaskId);
      const overTaskId = parseTaskDragId(String(over.id));
      let newIndex = columnTasks.length - 1;
      if (overTaskId !== null) {
        const overIndex = columnTasks.findIndex((t) => t.id === overTaskId);
        if (overIndex >= 0) newIndex = overIndex;
      }
      if (oldIndex === newIndex) return;

      const reordered = arrayMove(columnTasks, oldIndex, newIndex).map(
        (t, i) => ({ ...t, sortOrder: i }),
      );

      nextTasks = [
        ...nextTasks.filter((t) => t.columnId !== activeColumnId),
        ...reordered,
      ];
    } else {
      const columnTasks = getColumnTasks(nextTasks, overColumnId);
      const orderedIds = columnTasks.map((t) => t.id);
      nextTasks = nextTasks.map((t) => {
        const idx = orderedIds.indexOf(t.id);
        if (idx >= 0) return { ...t, sortOrder: idx };
        return t;
      });
    }

    const snapshot = tasksSnapshotRef.current;
    setTasks(nextTasks);

    try {
      const targetTasks = getColumnTasks(nextTasks, overColumnId);
      const orderedIds = targetTasks.map((t) => t.id);
      const updated = await moveTaskWithReorder(
        activeTaskId,
        overColumnId,
        orderedIds,
      );
      setTasks((prev) => {
        const others = prev.filter((t) => t.columnId !== overColumnId);
        return [...others, ...updated];
      });
      if (activeBoardId) {
        void loadBoardData(activeBoardId);
      }
    } catch {
      setTasks(snapshot);
      toast.error("Failed to move task");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <p className="font-head text-sm uppercase tracking-wider text-muted-foreground">
          Loading kanban…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:min-h-[calc(100vh-6rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-head text-2xl font-bold tracking-tight">
            Tasks / Kanban
          </h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Visual workflow boards with calendar sync.
          </p>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Drawer open={mobileBoardsOpen} onOpenChange={setMobileBoardsOpen}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMobileBoardsOpen(true)}
            >
              <LayoutGrid className="size-4" />
              Boards
            </Button>
            <Drawer.Content className="inset-y-0 left-0 right-auto mt-0 h-full max-h-screen w-[min(18rem,85vw)] max-w-none rounded-none border-r-2 border-t-0 p-4">
              <BoardSidebar
                boards={boards}
                activeBoardId={activeBoardId}
                onSelectBoard={(id) => void selectBoard(id)}
                onNewBoard={openCreateBoard}
                onEditBoard={openEditBoard}
                onBoardDeleted={(id) => void handleBoardDeleted(id)}
                className="w-full border-0 p-0 shadow-none"
              />
            </Drawer.Content>
          </Drawer>
          <Button type="button" onClick={openCreateBoard}>
            <Plus className="size-4" />
            New board
          </Button>
        </div>
      </div>

      {boards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded border-2 border-border bg-background p-8 text-center shadow-md">
          <p className="font-sans text-muted-foreground">
            Create your first board to start organizing tasks.
          </p>
          <Button type="button" onClick={openCreateBoard}>
            <Plus className="size-4" />
            Create board
          </Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <BoardSidebar
            boards={boards}
            activeBoardId={activeBoardId}
            onSelectBoard={(id) => void selectBoard(id)}
            onNewBoard={openCreateBoard}
            onEditBoard={openEditBoard}
            onBoardDeleted={(id) => void handleBoardDeleted(id)}
            className="hidden lg:flex"
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded border-2 border-border bg-background p-3 shadow-md sm:p-4">
            {activeBoard ? (
              <div className="mb-3 flex items-center justify-between gap-2 border-b-2 border-border pb-3">
                <h2 className="font-head text-lg">{activeBoard.name}</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAutomationPanelOpen(true)}
                >
                  <Zap className="size-4 text-amber-600" />
                  Automations
                </Button>
              </div>
            ) : null}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={(e) => void handleDragEnd(e)}
              onDragCancel={() => setActiveDragTask(null)}
            >
              {activeBoardId ? (
                <KanbanBoard
                  boardId={activeBoardId}
                  columns={columns}
                  tasks={tasks}
                  pulseRiskByTaskId={pulseRiskByTaskId}
                  onAddTask={openCreateTask}
                  onEditTask={openEditTask}
                  onColumnCreated={(col) =>
                    setColumns((prev) => [...prev, col])
                  }
                  onRenameColumn={(id, name) =>
                    void handleRenameColumn(id, name)
                  }
                  onChangeColumnColor={(id, color) =>
                    void handleChangeColumnColor(id, color)
                  }
                  onMoveColumnLeft={(id) =>
                    void handleMoveColumn(id, "left")
                  }
                  onMoveColumnRight={(id) =>
                    void handleMoveColumn(id, "right")
                  }
                  onDeleteColumn={(id) => void handleDeleteColumn(id)}
                />
              ) : null}

              <DragOverlay>
                {activeDragTask ? (
                  (() => {
                    const col =
                      columns.find((c) => c.id === activeDragTask.columnId) ??
                      columns[0];
                    if (!col) return null;
                    return (
                      <KanbanCard
                        task={activeDragTask}
                        column={col}
                        onEdit={() => {}}
                        showDragHandle={false}
                        overlay
                      />
                    );
                  })()
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      )}

      <BoardDialog
        open={boardDialogOpen}
        onOpenChange={setBoardDialogOpen}
        editing={editingBoard}
        onSaved={handleBoardSaved}
      />

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        defaults={taskDefaults}
        onSaved={(saved) => {
          upsertTask(saved);
          if (activeBoardId) void loadBoardData(activeBoardId);
        }}
        onDeleted={removeTask}
      />

      {activeBoardId ? (
        <AutomationPanel
          open={automationPanelOpen}
          onOpenChange={setAutomationPanelOpen}
          boardId={activeBoardId}
          columns={columns}
        />
      ) : null}
    </div>
  );
}
